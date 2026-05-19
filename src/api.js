import { API_STAGE_BY_ID, SAMPLE_BLOCKS, SAMPLE_DRAFT, SAMPLE_PROJECTS, STAGE_BY_API } from "./constants";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const LOCAL_KEY = "episteme.local.v2";
const LOCAL_CACHE_VERSION = 2;

function getNativeSyncBridge() {
  return globalThis?.__EPISTEME_SYNC__ || globalThis?.Capacitor?.Plugins?.EpistemeSync || null;
}

function normalizeProject(project) {
  return {
    ...project,
    stageId: STAGE_BY_API[project.stage] || project.stage || "seed",
    tags: project.tags || [],
    progress: project.progress || 0
  };
}

function stageOfBlock(block) {
  return block.metadata?.stage || (block.type === "evidence" ? "evidence" : "exploration");
}

function normalizeBundle(bundle) {
  const project = normalizeProject(bundle.project);
  const evidenceState = new Map((bundle.evidence || []).map((item) => [item.id, item]));
  const blocks = (bundle.blocks || []).map((block) => ({
    ...block,
    metadata: block.metadata || {},
    links: block.links || [],
    stageId: stageOfBlock(block),
    ...(evidenceState.get(block.id) || {})
  }));
  return {
    ...bundle,
    project,
    blocks,
    evidence: (bundle.evidence || []).map((item) => ({ ...item, stageId: "evidence" })),
    draft: bundle.draft || { ...SAMPLE_DRAFT, project_id: project.id, content: "" },
    draft_evidence_links: bundle.draft_evidence_links || [],
    references: bundle.references || [],
    exports: bundle.exports || []
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

function loadLocal() {
  const saved = localStorage.getItem(LOCAL_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && parsed.version === LOCAL_CACHE_VERSION && parsed.data) return parsed.data;
    if (parsed && parsed.projects && parsed.bundles) return parsed;
  }
  const initial = {
    projects: SAMPLE_PROJECTS,
    bundles: {
      "local-p1": {
        project: SAMPLE_PROJECTS[0],
        blocks: SAMPLE_BLOCKS,
        edges: [],
        references: [],
        draft: SAMPLE_DRAFT,
        evidence: SAMPLE_BLOCKS.filter((block) => block.type === "evidence"),
        draft_evidence_links: [],
        exports: []
      }
    }
  };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(initial));
  return initial;
}

function saveLocal(data) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify({ version: LOCAL_CACHE_VERSION, data }));
}

function localApi() {
  return {
    mode: "local",
    async listProjects() {
      return loadLocal().projects.map(normalizeProject);
    },
    async createProject(payload) {
      const data = loadLocal();
      const id = `local-p${Date.now()}`;
      const project = normalizeProject({
        id,
        title: payload.title || payload.question,
        question: payload.question,
        interest: payload.interest || "",
        output_type: payload.output_type || "article",
        thesis: "",
        stage: "Seed",
        tags: payload.tags || [],
        progress: 0,
        export_status: "not_exported",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      data.projects.unshift(project);
      data.bundles[id] = {
        project,
        blocks: [
          {
            id: `local-b${Date.now()}`,
            project_id: id,
            type: "question",
            content: payload.question,
            metadata: { stage: "seed", templateKey: "question" },
            links: []
          }
        ],
        edges: [],
        references: [],
        draft: { ...SAMPLE_DRAFT, project_id: id, content: "", revision: 1 },
        evidence: [],
        draft_evidence_links: [],
        exports: []
      };
      saveLocal(data);
      return project;
    },
    async getProject(projectId) {
      return normalizeBundle(loadLocal().bundles[projectId]);
    },
    async updateProject(projectId, patch) {
      const data = loadLocal();
      const normalizedPatch = { ...patch };
      if (patch.stage) normalizedPatch.stage = patch.stage;
      data.projects = data.projects.map((project) => project.id === projectId ? { ...project, ...normalizedPatch, updated_at: new Date().toISOString() } : project);
      data.bundles[projectId].project = { ...data.bundles[projectId].project, ...normalizedPatch, updated_at: new Date().toISOString() };
      saveLocal(data);
      return normalizeProject(data.bundles[projectId].project);
    },
    async deleteProject(projectId) {
      const data = loadLocal();
      data.projects = data.projects.filter((project) => project.id !== projectId);
      delete data.bundles[projectId];
      saveLocal(data);
    },
    async createBlock(projectId, payload) {
      const data = loadLocal();
      const block = {
        id: `local-b${Date.now()}`,
        project_id: projectId,
        links: [],
        metadata: {},
        ...payload
      };
      data.bundles[projectId].blocks.push(block);
      if (block.type === "evidence") data.bundles[projectId].evidence.push({ ...block, priority: 0, checked: false });
      saveLocal(data);
      return block;
    },
    async updateBlock(blockId, patch) {
      const data = loadLocal();
      let updated;
      Object.values(data.bundles).forEach((bundle) => {
        bundle.blocks = bundle.blocks.map((block) => {
          if (block.id !== blockId) return block;
          updated = { ...block, ...patch };
          return updated;
        });
        bundle.evidence = bundle.evidence.map((block) => block.id === blockId ? { ...block, ...patch } : block);
      });
      saveLocal(data);
      return updated;
    },
    async deleteBlock(blockId) {
      const data = loadLocal();
      Object.values(data.bundles).forEach((bundle) => {
        bundle.blocks = bundle.blocks.filter((block) => block.id !== blockId);
        bundle.evidence = bundle.evidence.filter((block) => block.id !== blockId);
      });
      saveLocal(data);
    },
    async saveDraft(projectId, payload) {
      const data = loadLocal();
      const updatedAt = new Date().toISOString();
      data.bundles[projectId].draft = {
        ...data.bundles[projectId].draft,
        ...payload,
        revision: (data.bundles[projectId].draft?.revision || 1) + 1,
        updated_at: updatedAt
      };
      data.bundles[projectId].project.updated_at = updatedAt;
      data.projects = data.projects.map((project) => project.id === projectId ? { ...project, updated_at: updatedAt } : project);
      saveLocal(data);
      return data.bundles[projectId].draft;
    },
    async updateEvidence(blockId, patch) {
      const data = loadLocal();
      let updated;
      Object.values(data.bundles).forEach((bundle) => {
        bundle.evidence = bundle.evidence.map((item) => {
          if (item.id !== blockId) return item;
          updated = { ...item, ...patch };
          return updated;
        });
        bundle.blocks = bundle.blocks.map((item) => item.id === blockId ? { ...item, ...patch } : item);
      });
      saveLocal(data);
      return updated;
    },
    async createDraftEvidenceLink(projectId, payload) {
      const data = loadLocal();
      const link = {
        id: `local-link${Date.now()}`,
        project_id: projectId,
        ...payload,
        anchor: payload.anchor || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      data.bundles[projectId].draft_evidence_links.push(link);
      data.bundles[projectId].evidence = data.bundles[projectId].evidence.map((item) => item.id === payload.evidence_block_id ? { ...item, checked: true } : item);
      data.bundles[projectId].blocks = data.bundles[projectId].blocks.map((item) => item.id === payload.evidence_block_id ? { ...item, checked: true } : item);
      saveLocal(data);
      return link;
    },
    async deleteDraftEvidenceLink(linkId) {
      const data = loadLocal();
      Object.values(data.bundles).forEach((bundle) => {
        const link = bundle.draft_evidence_links.find((item) => item.id === linkId);
        bundle.draft_evidence_links = bundle.draft_evidence_links.filter((item) => item.id !== linkId);
        if (link && !bundle.draft_evidence_links.some((item) => item.evidence_block_id === link.evidence_block_id)) {
          bundle.evidence = bundle.evidence.map((item) => item.id === link.evidence_block_id ? { ...item, checked: false } : item);
          bundle.blocks = bundle.blocks.map((item) => item.id === link.evidence_block_id ? { ...item, checked: false } : item);
        }
      });
      saveLocal(data);
    },
    async exportProject(projectId, type) {
      return JSON.stringify(loadLocal().bundles[projectId], null, 2);
    }
  };
}

function remoteApi() {
  return {
    mode: "api",
    async listProjects() {
      const projects = await request("/projects");
      return projects.map(normalizeProject);
    },
    async createProject(payload) {
      return normalizeProject(await request("/projects", { method: "POST", body: JSON.stringify(payload) }));
    },
    async getProject(projectId) {
      return normalizeBundle(await request(`/projects/${projectId}`));
    },
    async updateProject(projectId, patch) {
      return normalizeProject(await request(`/projects/${projectId}`, { method: "PATCH", body: JSON.stringify(patch) }));
    },
    async deleteProject(projectId) {
      return request(`/projects/${projectId}`, { method: "DELETE" });
    },
    async createBlock(projectId, payload) {
      return request(`/projects/${projectId}/blocks`, { method: "POST", body: JSON.stringify(payload) });
    },
    async updateBlock(blockId, patch) {
      return request(`/blocks/${blockId}`, { method: "PATCH", body: JSON.stringify(patch) });
    },
    async deleteBlock(blockId) {
      return request(`/blocks/${blockId}`, { method: "DELETE" });
    },
    async saveDraft(projectId, payload) {
      return request(`/projects/${projectId}/draft`, { method: "PUT", body: JSON.stringify(payload) });
    },
    async updateEvidence(blockId, patch) {
      return request(`/evidence/${blockId}`, { method: "PATCH", body: JSON.stringify(patch) });
    },
    async createDraftEvidenceLink(projectId, payload) {
      return request(`/projects/${projectId}/draft/evidence-links`, { method: "POST", body: JSON.stringify(payload) });
    },
    async deleteDraftEvidenceLink(linkId) {
      return request(`/draft/evidence-links/${linkId}`, { method: "DELETE" });
    },
    async exportProject(projectId, type) {
      return request(`/projects/${projectId}/exports`, { method: "POST", body: JSON.stringify({ type }) });
    }
  };
}

function nativeApi(bridge) {
  return {
    mode: "cloudkit",
    async listProjects() {
      return (await bridge.listProjects()).map(normalizeProject);
    },
    async createProject(payload) {
      return normalizeProject(await bridge.createProject(payload));
    },
    async getProject(projectId) {
      return normalizeBundle(await bridge.getProject(projectId));
    },
    async updateProject(projectId, patch) {
      return normalizeProject(await bridge.updateProject(projectId, patch));
    },
    async deleteProject(projectId) {
      return bridge.deleteProject(projectId);
    },
    async createBlock(projectId, payload) {
      return bridge.createBlock(projectId, payload);
    },
    async updateBlock(blockId, patch) {
      return bridge.updateBlock(blockId, patch);
    },
    async deleteBlock(blockId) {
      return bridge.deleteBlock(blockId);
    },
    async saveDraft(projectId, payload) {
      return bridge.saveDraft(projectId, payload);
    },
    async updateEvidence(blockId, patch) {
      return bridge.updateEvidence(blockId, patch);
    },
    async createDraftEvidenceLink(projectId, payload) {
      return bridge.createDraftEvidenceLink(projectId, payload);
    },
    async deleteDraftEvidenceLink(linkId) {
      return bridge.deleteDraftEvidenceLink(linkId);
    },
    async exportProject(projectId, type) {
      return bridge.exportProject(projectId, type);
    }
  };
}

export async function createApi() {
  const bridge = getNativeSyncBridge();
  if (bridge) return nativeApi(bridge);
  try {
    await request("/health");
    return remoteApi();
  } catch {
    return localApi();
  }
}

export function toApiStage(stageId) {
  return API_STAGE_BY_ID[stageId] || "Seed";
}
