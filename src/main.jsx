import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useEditor, EditorContent } from "@tiptap/react";
import { Mark, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Archive,
  ArrowRight,
  Check,
  Circle,
  Download,
  FileText,
  GripVertical,
  Home,
  Link,
  ListTree,
  Plus,
  Search,
  Settings,
  Sparkles,
  Tags,
  Trash2,
  X
} from "lucide-react";
import { createApi, toApiStage } from "./api";
import { triggerAnimation } from "./animation";
import { BLOCK_TYPES, STAGES, TEMPLATE_ROWS } from "./constants";
import "./styles.css";

const accent = {
  sage: { accent: "oklch(0.5 0.13 150)", soft: "oklch(0.92 0.04 150)", deep: "oklch(0.38 0.13 150)" },
  rust: { accent: "oklch(0.55 0.13 35)", soft: "oklch(0.93 0.04 35)", deep: "oklch(0.42 0.13 35)" },
  ink: { accent: "oklch(0.35 0.04 250)", soft: "oklch(0.92 0.02 250)", deep: "oklch(0.25 0.04 250)" }
};

const EvidenceCitation = Mark.create({
  name: "evidenceCitation",
  inclusive: false,
  addAttributes() {
    return {
      linkId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-link-id"),
        renderHTML: (attributes) => attributes.linkId ? { "data-link-id": attributes.linkId } : {}
      },
      evidenceId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-evidence-id"),
        renderHTML: (attributes) => attributes.evidenceId ? { "data-evidence-id": attributes.evidenceId } : {}
      }
    };
  },
  parseHTML() {
    return [{ tag: "span[data-evidence-citation]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-evidence-citation": "true",
        class: "evidence-citation",
        title: "Linked evidence"
      }),
      0
    ];
  }
});

function App() {
  const [api, setApi] = useState(null);
  const [mode, setMode] = useState("loading");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [bundle, setBundle] = useState(null);
  const [view, setView] = useState("dashboard");
  const [stage, setStage] = useState("exploration");
  const [newOpen, setNewOpen] = useState(false);
  const [theme, setTheme] = useState("cold");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isIOSNative = Boolean(window.Capacitor?.getPlatform?.() === "ios" || window.Capacitor?.isNativePlatform?.() && window.Capacitor?.getPlatform?.() === "ios");
    if (params.get("desktop") === "1") {
      document.documentElement.setAttribute("data-shell", "desktop");
    } else if (isIOSNative || /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
      document.documentElement.setAttribute("data-shell", "ios");
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-density", "comfortable");
    document.documentElement.setAttribute("data-rules", "on");
    document.documentElement.style.setProperty("--accent", accent.sage.accent);
    document.documentElement.style.setProperty("--accent-soft", accent.sage.soft);
    document.documentElement.style.setProperty("--accent-deep", accent.sage.deep);
  }, [theme]);

  const refreshProjects = useCallback(async (client = api) => {
    if (!client) return;
    const loaded = await client.listProjects();
    setProjects(loaded);
    if (!projectId && loaded[0]) setProjectId(loaded[0].id);
  }, [api, projectId]);

  const refreshBundle = useCallback(async (id = projectId, client = api) => {
    if (!client || !id) return;
    const loaded = await client.getProject(id);
    setBundle(loaded);
    setStage((current) => current || loaded.project.stageId || "seed");
  }, [api, projectId]);

  useEffect(() => {
    (async () => {
      const client = await createApi();
      setApi(client);
      setMode(client.mode);
      const loaded = await client.listProjects();
      setProjects(loaded);
      if (loaded[0]) {
        setProjectId(loaded[0].id);
        setBundle(await client.getProject(loaded[0].id));
        setStage(loaded[0].stageId || "seed");
      }
    })();
  }, []);

  useEffect(() => {
    if (api && projectId) refreshBundle(projectId, api);
  }, [api, projectId, refreshBundle]);

  const blocksByStage = useMemo(() => {
    const grouped = {};
    (bundle?.blocks || []).forEach((block) => {
      const key = block.stageId || block.metadata?.stage || "exploration";
      grouped[key] = grouped[key] || [];
      grouped[key].push(block);
    });
    return grouped;
  }, [bundle]);

  async function createProject(payload) {
    const project = await api.createProject(payload);
    setNewOpen(false);
    setProjectId(project.id);
    setView("workspace");
    setStage("seed");
    triggerAnimation("anim-scale", 300);
    await refreshProjects(api);
  }

  async function patchProject(patch) {
    if (!bundle) return;
    const updated = await api.updateProject(bundle.project.id, patch);
    setBundle((current) => ({ ...current, project: updated }));
    triggerAnimation("stage-change", 420);
    await refreshProjects(api);
  }

  async function deleteProject(projectIdToDelete) {
    if (!api || !projectIdToDelete) return;
    if (!window.confirm("Delete this project permanently? This cannot be undone.")) return;
    triggerAnimation("anim-fade", 220);
    await api.deleteProject(projectIdToDelete);
    const loaded = await refreshProjects(api);
    const nextProject = loaded.find((project) => project.id !== projectIdToDelete) || loaded[0] || null;
    if (!nextProject) {
      setBundle(null);
      setProjectId(null);
      setView("dashboard");
      setStage("seed");
      return;
    }
    setProjectId(nextProject.id);
    setBundle(await api.getProject(nextProject.id));
    setView("workspace");
    setStage(nextProject.stageId || "seed");
  }

  async function createBlock(type, stageId = stage, content = "") {
    if (!bundle) return;
    await api.createBlock(bundle.project.id, {
      type,
      content: content || typeLabel(type),
      metadata: { stage: stageId }
    });
    triggerAnimation("anim-fade-up", 300);
    await refreshBundle();
  }

  async function updateBlock(block, patch) {
    await api.updateBlock(block.id, patch);
    await refreshBundle();
  }

  async function deleteBlock(block) {
    triggerAnimation("anim-fade", 220);
    await api.deleteBlock(block.id);
    await refreshBundle();
  }

  if (!api) {
    return <div className="boot"><div className="brand"><span className="mark" />Episteme</div><span>Opening research notebook…</span></div>;
  }

  if (!bundle) {
    return (
      <>
        <Dashboard projects={projects} onOpen={(id) => { setProjectId(id); setView("workspace"); }} onDelete={deleteProject} onNew={() => setNewOpen(true)} />
        {newOpen && <NewProjectModal onClose={() => setNewOpen(false)} onCreate={createProject} />}
      </>
    );
  }

  if (view === "dashboard") {
    return (
      <>
        <Dashboard projects={projects} onOpen={(id) => { setProjectId(id); setView("workspace"); }} onDelete={deleteProject} onNew={() => setNewOpen(true)} />
        {newOpen && <NewProjectModal onClose={() => setNewOpen(false)} onCreate={createProject} />}
      </>
    );
  }

  const noRight = ["mapping", "drafting", "publishing"].includes(stage);
  return (
    <div className={`shell ${noRight ? "no-right" : ""}`}>
      <TopBar
        project={bundle.project}
        mode={mode}
        stage={stage}
        onDashboard={() => setView("dashboard")}
        onExport={() => setStage("publishing")}
        onDeleteProject={() => deleteProject(bundle.project.id)}
        theme={theme}
        setTheme={setTheme}
      />
      <Sidebar
        projects={projects}
        project={bundle.project}
        stage={stage}
        setStage={async (next) => {
          setStage(next);
          await patchProject({ stage: toApiStage(next) });
        }}
        blocksByStage={blocksByStage}
        onProject={setProjectId}
        onDashboard={() => setView("dashboard")}
      />
      {stage === "mapping" ? (
        <Mapping bundle={bundle} />
      ) : (
        <main className="main">
          <div className={`main-inner ${noRight ? "wide" : ""}`}>
            <StageStrip stage={stage} setStage={setStage} blocksByStage={blocksByStage} />
            <PageHeader stage={stage} project={bundle.project} blocksByStage={blocksByStage} />
            {["seed", "distillation", "thesis"].includes(stage) && (
              <TemplateEditor stage={stage} blocks={blocksByStage[stage] || []} onCreate={createBlock} onUpdate={updateBlock} />
            )}
            {stage === "exploration" && (
              <SemanticBlocks
                blocks={blocksByStage.exploration || []}
                allBlocks={bundle.blocks}
                onAdd={createBlock}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
              />
            )}
            {stage === "evidence" && (
              <EvidenceManager bundle={bundle} api={api} onRefresh={refreshBundle} onAdd={createBlock} />
            )}
            {stage === "drafting" && (
              <Drafting bundle={bundle} api={api} onRefresh={refreshBundle} />
            )}
            {stage === "publishing" && (
              <Publishing bundle={bundle} api={api} onRefresh={refreshBundle} />
            )}
          </div>
        </main>
      )}
      {!noRight && <RightPanel bundle={bundle} />}
      {newOpen && <NewProjectModal onClose={() => setNewOpen(false)} onCreate={createProject} />}
    </div>
  );
}

function TopBar({ project, mode, stage, onDashboard, onExport, onDeleteProject, theme, setTheme }) {
  return (
    <header className="topbar">
      <div className="brand"><span className="mark" /><span>Episteme</span></div>
      <div className="crumbs">
        <button onClick={onDashboard}>Projects</button><span>/</span><strong>{project.title}</strong><span>/</span><span>{stageLabel(stage)}</span>
        <span className={`mode-pill ${mode}`}>{mode === "api" ? "backend" : "local"}</span>
      </div>
      <div className="actions">
        <button className="iconbtn" title="Search"><Search size={15} /></button>
        <button className="iconbtn" title="Export" onClick={onExport}><Download size={15} /></button>
        {onDeleteProject && <button className="iconbtn danger" title="Delete project" onClick={onDeleteProject}><Trash2 size={15} /></button>}
        <button className="iconbtn" title="Theme" onClick={() => setTheme(theme === "dark" ? "cold" : "dark")}><Settings size={15} /></button>
      </div>
    </header>
  );
}

function Dashboard({ projects, onOpen, onDelete, onNew }) {
  const [filter, setFilter] = useState("all");
  const filters = [
    ["all", "All projects", projects.length],
    ["active", "Active", projects.filter((p) => !["published", "archived"].includes(p.stageId)).length],
    ["seed", "Seeds", projects.filter((p) => p.stageId === "seed").length],
    ["drafting", "Drafting", projects.filter((p) => p.stageId === "drafting").length],
    ["published", "Published", projects.filter((p) => p.stageId === "published").length]
  ];
  const shown = projects.filter((project) => filter === "all" || (filter === "active" ? !["published", "archived"].includes(project.stageId) : project.stageId === filter));
  return (
    <div className="shell no-right">
      <header className="topbar">
        <div className="brand"><span className="mark" /><span>Episteme</span></div>
        <div className="crumbs"><strong>Projects</strong></div>
        <div className="actions"><button className="iconbtn"><Search size={15} /></button></div>
      </header>
      <aside className="sidebar">
        <section className="side-section">
          <div className="head">Library</div>
          {filters.map(([id, label, count]) => (
            <button key={id} className={`side-item ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>
              {id === "all" ? <ListTree size={14} /> : id === "drafting" ? <FileText size={14} /> : <Circle size={11} />}
              <span>{label}</span><span className="count">{count}</span>
            </button>
          ))}
        </section>
        <section className="side-section">
          <div className="head">Tags</div>
          {[...new Set(projects.flatMap((p) => p.tags || []))].slice(0, 12).map((tag) => (
            <div className="side-item" key={tag}><Tags size={13} /><span>{tag}</span></div>
          ))}
        </section>
        <button className="btn accent new-bottom" onClick={onNew}><Plus size={13} /> New curiosity</button>
      </aside>
      <main className="main">
        <div className="main-inner wide">
          <div className="dashboard-head">
            <div>
              <h1 className="page-title">Your <em>curiosities</em></h1>
              <div className="page-sub"><span>{shown.length} projects</span><span className="dot" /><span>sorted by recency</span></div>
            </div>
            <button className="btn accent" onClick={onNew}><Plus size={13} /> New curiosity</button>
          </div>
          <div className="proj-grid">
            {shown.map((project) => (
              <article key={project.id} className="proj-card" onClick={() => onOpen(project.id)}>
                <button
                  className="proj-delete"
                  title="Delete project"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(project.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
                <div className="stage-badge"><span className="status-dot" />{stageLabel(project.stageId)} · {relative(project.updated_at)}</div>
                <h3>{project.title}</h3>
                <p className={project.thesis ? "thesis" : "thesis fade"}>{project.thesis || "No thesis yet. Still seeding."}</p>
                <div className="tag-row">{(project.tags || []).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                <div className="progress"><div style={{ width: `${project.progress || 0}%` }} /></div>
                <footer><span>{project.progress || 0}% explored</span><span>open <ArrowRight size={11} /></span></footer>
              </article>
            ))}
            <button className="proj-card create-card" onClick={onNew}><Plus size={24} /><em>Plant a new curiosity</em><span>Every project starts as a question.</span></button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ projects, project, stage, setStage, blocksByStage, onProject, onDashboard }) {
  return (
    <aside className="sidebar">
      <section className="side-section">
        <div className="head">This project</div>
        <div className="project-mini"><strong>{project.title}</strong><span>local-first research notebook</span></div>
      </section>
      <section className="side-section">
        <div className="head"><span>Lifecycle</span><span>{project.progress || 0}%</span></div>
        <div className="lifecycle-rail">
          {STAGES.map((item) => (
            <button key={item.id} className={`side-item ${stage === item.id ? "active" : ""}`} onClick={() => setStage(item.id)}>
              <span className="num">{item.n}</span><span>{item.label}</span>
              {(blocksByStage[item.id] || []).length > 0 && <span className="count">{blocksByStage[item.id].length}</span>}
            </button>
          ))}
        </div>
      </section>
      <section className="side-section">
        <div className="head">Other projects</div>
        {projects.filter((item) => item.id !== project.id).slice(0, 4).map((item) => (
          <button className="side-item" key={item.id} onClick={() => onProject(item.id)}>
            <span className="status-dot" /><span className="truncate">{item.title}</span>
          </button>
        ))}
        <button className="side-item muted" onClick={onDashboard}><Home size={13} /> All projects</button>
      </section>
      <div className="sidebar-foot"><span>local · offline-ready</span><span>v0.1</span></div>
    </aside>
  );
}

function StageStrip({ stage, setStage, blocksByStage }) {
  return (
    <div className="stage-strip">
      {STAGES.map((item, index) => (
        <React.Fragment key={item.id}>
          <button className={`stage ${stage === item.id ? "active" : ""}`} onClick={() => setStage(item.id)}>
            <span>{item.n}</span>{item.label}{(blocksByStage[item.id] || []).length > 0 && <small>{blocksByStage[item.id].length}</small>}
          </button>
          {index < STAGES.length - 1 && <i />}
        </React.Fragment>
      ))}
    </div>
  );
}

function PageHeader({ stage, project, blocksByStage }) {
  const copy = {
    seed: ["Plant the seed.", "Raw curiosity. No structure required yet."],
    distillation: ["Distill the question.", "Sharpen vague wondering into something researchable."],
    exploration: ["Range widely.", "Collect ideas, evidence, analogies, contradictions."],
    mapping: ["Map the concepts.", "Build the graph of how your blocks relate."],
    thesis: ["Compress to a thesis.", "One claim, defensible."],
    evidence: ["Gather evidence.", "Prioritize the proof material you will use while writing."],
    drafting: ["Write the article.", "Select prose to cite. Evidence in the rail checks itself off."],
    publishing: ["Publish.", "Export the draft, notebook, and project graph."]
  };
  const [title, sub] = copy[stage] || [stage, ""];
  return (
    <div className="page-head">
      <h1 className="page-title">{title.split(" ").slice(0, -1).join(" ")} <em>{title.split(" ").at(-1)}</em></h1>
      <div className="page-sub"><span>{stageLabel(stage)}</span><span className="dot" /><span>{(blocksByStage[stage] || []).length} blocks</span><span className="dot" /><span>{project.title}</span></div>
      <p>{sub}</p>
    </div>
  );
}

function TemplateEditor({ stage, blocks, onCreate, onUpdate }) {
  const rows = TEMPLATE_ROWS[stage] || [];
  const byKey = new Map(blocks.map((block) => [block.metadata?.templateKey, block]));
  async function save(key, content) {
    const existing = byKey.get(key);
    if (existing) await onUpdate(existing, { content, metadata: { ...existing.metadata, stage, templateKey: key } });
    else if (content.trim()) await onCreate(key === "main" ? "claim" : key === "question" || key === "broad" || key === "precise" || key === "researchable" ? "question" : "observation", stage, content);
  }
  return (
    <div className="templ">
      {rows.map(([key, label, placeholder]) => (
        <label className={`templ-row ${key === "main" ? "thesis-row" : ""}`} key={key}>
          <span>{label}</span>
          <EditableText value={byKey.get(key)?.content || ""} placeholder={placeholder} onSave={(content) => save(key, content)} />
        </label>
      ))}
    </div>
  );
}

function SemanticBlocks({ blocks, allBlocks, onAdd, onUpdate, onDelete }) {
  const [selected, setSelected] = useState(null);
  const [linking, setLinking] = useState(null);
  async function completeLink(target) {
    if (!linking || target.id === linking.id) return;
    const links = new Set(linking.links || []);
    links.add(target.id);
    await onUpdate(linking, { links: [...links] });
    setLinking(null);
  }
  return (
    <div className="blocks">
      {blocks.map((block) => (
        <article
          className={`block ${selected === block.id ? "selected" : ""} ${linking?.id === block.id ? "linking" : ""}`}
          key={block.id}
          onClick={() => linking ? completeLink(block) : setSelected(block.id)}
        >
          <div className="block-gutter">
            <button title="Link block" onClick={(event) => { event.stopPropagation(); setLinking(block); }}><Link size={12} /></button>
            <button title="Delete block" onClick={(event) => { event.stopPropagation(); onDelete(block); }}><Trash2 size={12} /></button>
          </div>
          <div className="block-type"><span className={`glyph ${glyphType(block.type)}`} />{typeLabel(block.type)}</div>
          <EditableText className="block-content" value={block.content} onSave={(content) => onUpdate(block, { content })} placeholder="Write the thought..." />
          {(block.links || []).length > 0 && <div className="block-meta"><Link size={11} />{block.links.map((id) => allBlocks.find((item) => item.id === id)?.content?.slice(0, 42)).filter(Boolean).join(" · ")}</div>}
        </article>
      ))}
      <div className="add-block-row">
        {BLOCK_TYPES.slice(0, 8).map((type) => <button key={type.id} onClick={() => onAdd(type.id, "exploration")}><Plus size={11} />{type.label}</button>)}
      </div>
      {linking && <div className="link-toast"><Link size={13} />Click another block to link from “{linking.content.slice(0, 42)}…” <button onClick={() => setLinking(null)}>Cancel</button></div>}
    </div>
  );
}

function EvidenceManager({ bundle, api, onRefresh, onAdd }) {
  const evidence = evidenceBlocks(bundle);
  async function patch(item, patch) {
    await api.updateEvidence(item.id, patch);
    await onRefresh();
  }
  return (
    <div className="evidence-page">
      <div className="toolbar-row">
        <h2 className="upper">Proof material · {evidence.length}</h2>
        <button className="btn accent" onClick={() => onAdd("evidence", "evidence", "New evidence")}><Plus size={13} /> Add evidence</button>
      </div>
      <div className="evidence-list">
        {evidence.map((item) => (
          <article className={`evidence-row ${item.checked ? "checked" : ""}`} key={item.id}>
            <div className="ev-state">{item.checked ? <Check size={14} /> : <Circle size={12} />}</div>
            <EditableText value={item.content} onSave={(content) => api.updateBlock ? api.updateBlock(item.id, { content }).then(onRefresh) : null} />
            <div className="priority">
              <span>Priority</span>
              <input type="range" min="0" max="100" value={item.priority || 0} onChange={(event) => patch(item, { priority: Number(event.target.value) })} />
              <strong>{item.priority || 0}</strong>
            </div>
            <button className="btn ghost" onClick={() => patch(item, { checked: !item.checked })}>{item.checked ? "Uncheck" : "Check"}</button>
          </article>
        ))}
      </div>
    </div>
  );
}

function Drafting({ bundle, api, onRefresh }) {
  const editorRef = useRef(null);
  const citationClearTimerRef = useRef(null);
  const [draft, setDraft] = useState(bundle.draft?.content || "");
  const [pending, setPending] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);
  const [saving, setSaving] = useState(false);
  const evidence = evidenceBlocks(bundle).sort((a, b) => (b.checked - a.checked) || ((b.priority || 0) - (a.priority || 0)));
  const links = bundle.draft_evidence_links || [];
  const checkedCount = evidence.filter((item) => item.checked).length;
  const editor = useEditor({
    extensions: [
      StarterKit,
      EvidenceCitation,
      Placeholder.configure({
        placeholder: "Write the entire article here. Select text, then click evidence in the rail to link it."
      })
    ],
    content: draftToEditorContent(bundle.draft),
    editorProps: {
      attributes: {
        class: "article-editor"
      }
    },
    onUpdate: ({ editor }) => {
      setDraft(editor.getText());
      setPending(null);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setPending(null);
        return;
      }
      const text = editor.state.doc.textBetween(from, to, " ").trim();
      if (text.length < 2) {
        setPending(null);
        return;
      }
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      setPending({
        text,
        anchor: { from, to },
        x: (start.left + end.right) / 2,
        y: Math.min(start.top, end.top)
      });
    }
  });

  useEffect(() => {
    const next = bundle.draft?.content || "";
    const nextEditorContent = draftToEditorContent(bundle.draft);
    setDraft(stripHtml(next));
    if (editor && editor.getHTML() !== nextEditorContent && editor.getText() !== next) {
      editor.commands.setContent(nextEditorContent, { emitUpdate: false });
    }
  }, [bundle.draft?.content, editor]);

  async function saveDraft(next = editor?.getHTML() || draft) {
    setSaving(true);
    triggerAnimation("stage-change", 420);
    await api.saveDraft(bundle.project.id, { content: next, content_format: "html" });
    setSaving(false);
    await onRefresh();
  }

  async function linkEvidence(item) {
    if (!pending) return;
    const link = await api.createDraftEvidenceLink(bundle.project.id, {
      evidence_block_id: item.id,
      selected_text: pending.text,
      anchor: pending.anchor,
      draft_revision: bundle.draft?.revision
    });
    if (editor) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: pending.anchor.from, to: pending.anchor.to })
        .setMark("evidenceCitation", { linkId: link.id, evidenceId: item.id })
        .run();
      await saveDraft(editor.getHTML());
    }
    setPending(null);
    await onRefresh();
  }

  async function unlink(link) {
    removeCitationMark(editor, link);
    setActiveCitation(null);
    await api.deleteDraftEvidenceLink(link.id);
    await onRefresh();
    if (editor) await saveDraft(editor.getHTML());
    await onRefresh();
  }

  async function prioritize(item, delta) {
    await api.updateEvidence(item.id, { priority: Math.max(0, Math.min(100, (item.priority || 0) + delta)) });
    await onRefresh();
  }

  function cancelCitationClear() {
    if (citationClearTimerRef.current) {
      clearTimeout(citationClearTimerRef.current);
      citationClearTimerRef.current = null;
    }
  }

  function scheduleCitationClear() {
    cancelCitationClear();
    citationClearTimerRef.current = window.setTimeout(() => {
      setActiveCitation(null);
      citationClearTimerRef.current = null;
    }, 650);
  }

  function inspectCitation(event) {
    const citation = citationFromEvent(event, links, evidence);
    if (!citation) {
      if (!event.currentTarget.contains(event.relatedTarget)) scheduleCitationClear();
      return;
    }
    cancelCitationClear();
    const rect = citation.element.getBoundingClientRect();
    setActiveCitation({
      ...citation,
      x: rect.left + rect.width / 2,
      y: rect.top
    });
  }

  return (
    <div className="drafting-grid">
      <section className="drafting-editor">
        <div className="article-stats">
          <span><strong>{wordCount(draft)}</strong> words</span><span className="dot" />
          <span><strong>{checkedCount}</strong>/{evidence.length} evidence checked</span><div className="progress-mini"><div style={{ width: `${Math.round((checkedCount / Math.max(1, evidence.length)) * 100)}%` }} /></div>
          <span className="dot" /><span>{saving ? "saving" : "saved"}</span>
        </div>
        <div
          ref={editorRef}
          className="article-editor-shell"
          onBlur={() => saveDraft()}
          onMouseMove={inspectCitation}
          onClick={inspectCitation}
          onMouseLeave={(event) => {
            if (
              event.relatedTarget?.closest?.(".citation-popover") ||
              event.relatedTarget?.closest?.(".linked-citation-row")
            ) {
              return;
            }
            scheduleCitationClear();
          }}
        >
          <EditorContent editor={editor} />
        </div>
        {links.length > 0 && (
          <div className="linked-citations">
            <h3 className="upper">Linked passages</h3>
            {links.map((link) => {
              const item = evidence.find((ev) => ev.id === link.evidence_block_id);
              return (
                <div
                  key={link.id}
                  className="linked-citation-row"
                  onMouseEnter={() => {
                    cancelCitationClear();
                    setActiveCitation({ link, evidence: item, x: window.innerWidth / 2, y: 140 });
                  }}
                  onMouseLeave={(event) => {
                    if (event.relatedTarget?.closest?.(".citation-popover")) return;
                    scheduleCitationClear();
                  }}
                >
                  <Link size={12} />
                  <span>“{link.selected_text}”</span>
                  <small>{item?.content?.slice(0, 72)}</small>
                  <button onClick={() => unlink(link)} title="Remove this evidence link">Unlink <X size={12} /></button>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <aside className="drafting-evidence">
        <div className="ev-head"><span className="upper">Evidence</span><span className={`ev-counter ${pending ? "targeting" : ""}`}>{checkedCount}/{evidence.length}</span></div>
        <div className={`ev-hint ${pending ? "active" : ""}`}>{pending ? "Click any evidence to link the selected text." : "Unchecked evidence stays prominent while you scroll and write."}</div>
        <div className="ev-list">
          {evidence.map((item, index) => (
            <article key={item.id} className={`ev-card ${item.checked ? "used" : "unused"} ${pending ? "targeting" : ""} ${activeCitation?.evidence?.id === item.id ? "citation-target" : ""}`} onClick={() => pending && linkEvidence(item)}>
              <div className="ev-card-head">
                <span className="ev-num">{index + 1}</span>
                <span className="ev-state">{item.checked ? <Check size={12} /> : <Circle size={10} />}</span>
                <span>{item.checked ? "checked" : "unchecked"}</span>
                <span className="ev-handle"><GripVertical size={12} /></span>
              </div>
              <p>{item.content}</p>
              <div className="ev-actions">
                <button onClick={(event) => { event.stopPropagation(); prioritize(item, 10); }}>Raise</button>
                <button onClick={(event) => { event.stopPropagation(); prioritize(item, -10); }}>Lower</button>
                <span>{item.priority || 0}</span>
              </div>
            </article>
          ))}
        </div>
      </aside>
      {pending && <div className="selection-toolbar" style={{ left: pending.x, top: pending.y }}><Link size={12} />Link selection to evidence</div>}
      {activeCitation?.link && (
        <div
          className="citation-popover"
          style={{ left: activeCitation.x, top: activeCitation.y }}
          onMouseEnter={cancelCitationClear}
          onMouseLeave={scheduleCitationClear}
        >
          <div className="upper">Linked evidence</div>
          <p>“{activeCitation.link.selected_text}”</p>
          <blockquote>{activeCitation.evidence?.content || "Evidence block not found."}</blockquote>
          <button onClick={() => unlink(activeCitation.link)}><X size={12} /> Unlink this citation</button>
        </div>
      )}
    </div>
  );
}

function Mapping({ bundle }) {
  const blocks = bundle.blocks || [];
  const nodes = blocks.slice(0, 18).map((block, index) => ({
    block,
    x: 50 + Math.cos((index / Math.max(1, blocks.length)) * Math.PI * 2) * (index === 0 ? 0 : 34),
    y: 50 + Math.sin((index / Math.max(1, blocks.length)) * Math.PI * 2) * (index === 0 ? 0 : 34)
  }));
  return (
    <main className="graph-canvas">
      <div className="graph-title"><span className="upper">Mapping</span><h2>Concept graph</h2><p>{blocks.length} nodes · links come from semantic block relations</p></div>
      <svg className="graph-svg">
        {nodes.flatMap(({ block, x, y }) => (block.links || []).map((targetId) => {
          const target = nodes.find((node) => node.block.id === targetId);
          if (!target) return null;
          return <line key={`${block.id}-${targetId}`} x1={`${x}%`} y1={`${y}%`} x2={`${target.x}%`} y2={`${target.y}%`} />;
        }))}
      </svg>
      {nodes.map(({ block, x, y }, index) => (
        <article key={block.id} className={`graph-node ${index === 0 ? "center" : ""}`} style={{ left: `${x}%`, top: `${y}%` }}>
          <small>{typeLabel(block.type)}</small><span>{block.content.slice(0, 86)}</span>
        </article>
      ))}
    </main>
  );
}

function Publishing({ bundle, api, onRefresh }) {
  const [selected, setSelected] = useState("markdown");
  const [output, setOutput] = useState("");
  async function runExport() {
    const artifact = await api.exportProject(bundle.project.id, selected);
    setOutput(typeof artifact === "string" ? artifact : JSON.stringify(artifact, null, 2));
    await onRefresh();
  }
  return (
    <div className="publishing">
      <div className="snapshot">
        <div><span className="upper">Snapshot</span><strong>{bundle.blocks.length} blocks · {evidenceBlocks(bundle).length} evidences · {wordCount(bundle.draft?.content || "")} draft words</strong></div>
        <button className="btn accent" onClick={runExport}><Download size={13} /> Export</button>
      </div>
      <div className="export-grid">
        {["markdown", "json"].map((format) => <button className={`export-card ${selected === format ? "active" : ""}`} key={format} onClick={() => setSelected(format)}><h3>{format}</h3><p>{format === "markdown" ? "Portable article and notebook." : "Machine-readable backup."}</p></button>)}
      </div>
      {output && <pre className="export-output">{output}</pre>}
    </div>
  );
}

function RightPanel({ bundle }) {
  const evidence = evidenceBlocks(bundle);
  const openEvidence = evidence.filter((item) => !item.checked).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return (
    <aside className="right">
      <div className="panel-tabs"><button className="active">Context</button><button>Papers</button><button>Questions</button></div>
      <h4>Current thesis</h4>
      <p className="serif-note">{bundle.project.thesis || "No thesis formed yet."}</p>
      <h4>Unchecked evidence</h4>
      {openEvidence.slice(0, 5).map((item) => <div className="right-card" key={item.id}><strong>{item.priority || 0}</strong><span>{item.content.slice(0, 120)}</span></div>)}
      <h4>Suggested next moves</h4>
      <div className="assistant-card"><Sparkles size={14} /><span>Use the drafting page to connect prose directly to evidence. Linked evidence will check itself off.</span></div>
    </aside>
  );
}

function NewProjectModal({ onClose, onCreate }) {
  const [question, setQuestion] = useState("");
  const [interest, setInterest] = useState("");
  const [tags, setTags] = useState("");
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => {
        event.preventDefault();
        if (!question.trim()) return;
        onCreate({ question, interest, output_type: "article", tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
      }}>
        <header><h3>New curiosity</h3><button type="button" className="iconbtn" onClick={onClose}><X size={15} /></button></header>
        <label>Question<input autoFocus value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What are you curious about?" /></label>
        <label>Why does this interest you?<textarea value={interest} onChange={(event) => setInterest(event.target.value)} placeholder="A confusion, contradiction, or itch." /></label>
        <label>Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="epistemics, hci" /></label>
        <footer><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn accent">Plant seed <ArrowRight size={12} /></button></footer>
      </form>
    </div>
  );
}

function EditableText({ value, onSave, placeholder = "", className = "field" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) ref.current.innerText = value || "";
  }, [value]);
  return <div ref={ref} className={className} contentEditable suppressContentEditableWarning data-placeholder={placeholder} onBlur={(event) => onSave(event.currentTarget.innerText)} />;
}

function evidenceBlocks(bundle) {
  const fromEvidence = new Map((bundle.evidence || []).map((item) => [item.id, item]));
  return (bundle.blocks || [])
    .filter((block) => block.type === "evidence")
    .map((block) => ({ ...block, ...(fromEvidence.get(block.id) || {}) }));
}

function stageLabel(stageId) {
  return STAGES.find((stage) => stage.id === stageId || stage.api === stageId)?.label || stageId;
}

function typeLabel(type) {
  return BLOCK_TYPES.find((item) => item.id === type)?.label || type.replaceAll("_", " ");
}

function glyphType(type) {
  return type === "counterargument" ? "counter" : type === "draft_paragraph" ? "draft" : type;
}

function wordCount(text) {
  return stripHtml(text).split(/\s+/).filter(Boolean).length;
}

function draftToEditorContent(draft) {
  const content = draft?.content || "";
  if (draft?.content_format === "html" || looksLikeHtml(content)) return content || "";
  return textToHtml(content);
}

function textToHtml(text) {
  const paragraphs = String(text || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return "";
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function removeCitationMark(editor, link) {
  if (!editor || !link) return;
  const markType = editor.schema.marks.evidenceCitation;
  if (!markType) return;
  const tr = editor.state.tr;
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    const hasTargetMark = node.marks.some((mark) => {
      if (mark.type !== markType) return false;
      return mark.attrs.linkId === link.id || mark.attrs.evidenceId === link.evidence_block_id;
    });
    if (hasTargetMark) tr.removeMark(pos, pos + node.nodeSize, markType);
  });
  if (tr.docChanged) editor.view.dispatch(tr);
}

function citationElementFromEvent(event) {
  const pointTarget = typeof event?.clientX === "number" && typeof event?.clientY === "number"
    ? document.elementFromPoint(event.clientX, event.clientY)
    : null;
  return normalizeCitationTarget(pointTarget || event.target);
}

function citationFromTarget(target, links, evidence) {
  const element = normalizeCitationTarget(target);
  if (!element) return null;
  const linkId = element.dataset.linkId || element.getAttribute("linkid");
  const evidenceId = element.dataset.evidenceId || element.getAttribute("evidenceid");
  const link = links.find((item) => item.id === linkId)
    || links.find((item) => item.evidence_block_id === evidenceId && element.textContent?.includes(item.selected_text));
  if (!link) return null;
  return {
    element,
    link,
    evidence: evidence.find((item) => item.id === link.evidence_block_id)
  };
}

function citationFromEvent(event, links, evidence) {
  const element = citationElementFromEvent(event);
  if (!element) return null;
  return citationFromTarget(element, links, evidence);
}

function normalizeCitationTarget(target) {
  if (!target) return null;
  const element = target.nodeType === Node.TEXT_NODE ? target.parentElement : target;
  return element?.closest?.(".evidence-citation") || element?.parentElement?.closest?.(".evidence-citation") || null;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function relative(value) {
  if (!value) return "recently";
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(1, Math.round(diff / 36e5));
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

createRoot(document.getElementById("root")).render(<App />);
