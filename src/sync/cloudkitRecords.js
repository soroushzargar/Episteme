export const CLOUDKIT_SCHEMA_VERSION = 2;

export const RECORD_TYPES = {
  project: "Project",
  block: "Block",
  edge: "Edge",
  evidenceState: "EvidenceState",
  draft: "Draft",
  draftEvidenceLink: "DraftEvidenceLink",
  reference: "Reference",
  asset: "Asset",
  exportHistory: "ExportHistory",
  tombstone: "Tombstone"
};

export const BUNDLE_KEYS = {
  project: "project",
  blocks: "blocks",
  edges: "edges",
  references: "references",
  draft: "draft",
  evidence: "evidence",
  draftEvidenceLinks: "draft_evidence_links",
  exports: "exports",
  assets: "assets",
  tombstones: "tombstones"
};

export function toCloudKitRecord(type, id, fields, now = new Date().toISOString()) {
  return {
    recordType: type,
    recordName: id,
    fields: {
      schemaVersion: CLOUDKIT_SCHEMA_VERSION,
      updatedAt: now,
      deletedAt: null,
      ...fields
    }
  };
}

export function normalizeRecord(record) {
  if (!record) return null;
  const recordType = record.recordType || record.recordTypeName || record.type;
  const recordName = record.recordName || record.id || record.recordID?.recordName;
  const fields = record.fields || record.recordFields || record.data || {};
  if (!recordType || !recordName) return null;
  return {
    recordType,
    recordName,
    fields: {
      schemaVersion: fields.schemaVersion || CLOUDKIT_SCHEMA_VERSION,
      updatedAt: fields.updatedAt || fields.updated_at || new Date(0).toISOString(),
      deletedAt: fields.deletedAt || fields.deleted_at || null,
      ...fields
    }
  };
}

function stringList(value) {
  return Array.isArray(value) ? value.filter((item) => item !== undefined && item !== null).map((item) => String(item)) : [];
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function sortedByUpdatedAt(records) {
  return [...records].sort((left, right) => new Date(left?.fields?.updatedAt || 0).getTime() - new Date(right?.fields?.updatedAt || 0).getTime());
}

function latestRecord(records, type) {
  return records.filter((record) => record.recordType === type).slice(-1)[0] || null;
}

export function projectRecord(project) {
  return toCloudKitRecord(RECORD_TYPES.project, project.id, {
    title: project.title,
    question: project.question,
    interest: project.interest || "",
    outputType: project.output_type || project.outputType || "article",
    thesis: project.thesis || "",
    stage: project.stage || "Seed",
    tags: project.tags || [],
    progress: project.progress || 0,
    exportStatus: project.export_status || project.exportStatus || "not_exported",
    archived: Boolean(project.archived)
  }, project.updated_at || project.updatedAt);
}

export function blockRecord(block) {
  return toCloudKitRecord(RECORD_TYPES.block, block.id, {
    projectId: block.project_id || block.projectId,
    type: block.type,
    content: block.content,
    metadata: block.metadata || {},
    links: block.links || []
  }, block.updated_at || block.updatedAt);
}

export function edgeRecord(edge) {
  return toCloudKitRecord(RECORD_TYPES.edge, edge.id, {
    projectId: edge.project_id || edge.projectId,
    sourceId: edge.source_id || edge.sourceId,
    targetId: edge.target_id || edge.targetId,
    relationType: edge.relation_type || edge.relationType || "supports"
  }, edge.created_at || edge.updated_at || edge.updatedAt);
}

export function evidenceStateRecord(evidence) {
  return toCloudKitRecord(RECORD_TYPES.evidenceState, evidence.id, {
    projectId: evidence.project_id || evidence.projectId,
    blockId: evidence.id,
    priority: evidence.priority || 0,
    checked: Boolean(evidence.checked),
    notes: evidence.evidence_notes || evidence.notes || ""
  }, evidence.updated_at || evidence.updatedAt);
}

export function draftRecord(draft) {
  return toCloudKitRecord(RECORD_TYPES.draft, `${draft.project_id || draft.projectId}:draft`, {
    projectId: draft.project_id || draft.projectId,
    content: draft.content || "",
    contentFormat: draft.content_format || draft.contentFormat || "markdown",
    revision: draft.revision || 1
  }, draft.updated_at || draft.updatedAt);
}

export function draftEvidenceLinkRecord(link) {
  return toCloudKitRecord(RECORD_TYPES.draftEvidenceLink, link.id, {
    projectId: link.project_id || link.projectId,
    evidenceBlockId: link.evidence_block_id || link.evidenceBlockId,
    selectedText: link.selected_text || link.selectedText,
    anchor: link.anchor || {},
    draftRevision: link.draft_revision || link.draftRevision || 1
  }, link.updated_at || link.updatedAt);
}

export function assetRecord(asset) {
  return toCloudKitRecord(RECORD_TYPES.asset, asset.id, {
    projectId: asset.project_id || asset.projectId,
    kind: asset.kind,
    filename: asset.filename,
    mimeType: asset.mime_type || asset.mimeType,
    byteSize: asset.byte_size || asset.byteSize || 0,
    checksum: asset.checksum || "",
    cloudAssetId: asset.cloud_asset_id || asset.cloudAssetId || ""
  }, asset.updated_at || asset.updatedAt);
}

export function bundleToCloudKitRecords(bundle) {
  if (!bundle?.project?.id) return [];
  const records = [projectRecord(bundle.project)];
  for (const block of bundle.blocks || []) records.push(blockRecord(block));
  for (const edge of bundle.edges || []) records.push(edgeRecord(edge));
  for (const evidence of bundle.evidence || []) records.push(evidenceStateRecord(evidence));
  for (const link of bundle.draft_evidence_links || []) records.push(draftEvidenceLinkRecord(link));
  if (bundle.draft) records.push(draftRecord(bundle.draft));
  for (const reference of bundle.references || []) {
    records.push(toCloudKitRecord(RECORD_TYPES.reference, reference.id, {
      projectId: reference.project_id || reference.projectId,
      title: reference.title,
      authors: stringList(reference.authors),
      url: reference.url || "",
      notes: reference.notes || "",
      metadata: objectValue(reference.metadata)
    }, reference.updated_at || reference.updatedAt));
  }
  for (const asset of bundle.assets || []) records.push(assetRecord(asset));
  for (const exportRecord of bundle.exports || []) {
    records.push(toCloudKitRecord(RECORD_TYPES.exportHistory, exportRecord.id, {
      projectId: exportRecord.project_id || exportRecord.projectId,
      type: exportRecord.type,
      output: exportRecord.output || null,
      slug: exportRecord.slug || "",
      status: exportRecord.status || "complete"
    }, exportRecord.updated_at || exportRecord.updatedAt));
  }
  for (const tombstone of bundle.tombstones || []) {
    records.push(tombstoneRecord(tombstone.sourceRecordType || tombstone.recordType, tombstone.sourceRecordName || tombstone.recordName, tombstone.deletedAt));
  }
  return records;
}

export function recordsToBundle(recordsInput) {
  const records = sortedByUpdatedAt((recordsInput || []).map(normalizeRecord).filter(Boolean));
  const project = latestRecord(records, RECORD_TYPES.project);
  if (!project) return null;

  const projectId = project.recordName;
  const matching = (type) => records.filter((record) => record.recordType === type && record.fields.projectId === projectId);
  const draft = latestRecord(matching(RECORD_TYPES.draft), RECORD_TYPES.draft);

  return {
    project: {
      id: projectId,
      title: project.fields.title,
      question: project.fields.question,
      interest: project.fields.interest || "",
      output_type: project.fields.outputType || "article",
      thesis: project.fields.thesis || "",
      stage: project.fields.stage || "Seed",
      tags: stringList(project.fields.tags),
      progress: project.fields.progress || 0,
      export_status: project.fields.exportStatus || "not_exported",
      archived: Boolean(project.fields.archived),
      updated_at: project.fields.updatedAt
    },
    blocks: matching(RECORD_TYPES.block).map((record) => ({
      id: record.recordName,
      project_id: record.fields.projectId,
      type: record.fields.type,
      content: record.fields.content || "",
      metadata: objectValue(record.fields.metadata),
      links: stringList(record.fields.links),
      updated_at: record.fields.updatedAt
    })),
    edges: matching(RECORD_TYPES.edge).map((record) => ({
      id: record.recordName,
      project_id: record.fields.projectId,
      source_id: record.fields.sourceId,
      target_id: record.fields.targetId,
      relation_type: record.fields.relationType || "supports",
      created_at: record.fields.updatedAt
    })),
    references: matching(RECORD_TYPES.reference).map((record) => ({
      id: record.recordName,
      project_id: record.fields.projectId,
      title: record.fields.title,
      authors: stringList(record.fields.authors),
      url: record.fields.url || "",
      notes: record.fields.notes || "",
      metadata: objectValue(record.fields.metadata),
      updated_at: record.fields.updatedAt
    })),
    draft: draft
      ? {
          id: `${projectId}:draft`,
          project_id: projectId,
          content: draft.fields.content || "",
          content_format: draft.fields.contentFormat || "markdown",
          revision: draft.fields.revision || 1,
          updated_at: draft.fields.updatedAt
        }
      : {
          id: `${projectId}:draft`,
          project_id: projectId,
          content: "",
          content_format: "markdown",
          revision: 1,
          updated_at: project.fields.updatedAt
        },
    evidence: matching(RECORD_TYPES.evidenceState).map((record) => ({
      id: record.recordName,
      project_id: record.fields.projectId,
      priority: record.fields.priority || 0,
      checked: Boolean(record.fields.checked),
      evidence_notes: record.fields.notes || "",
      updated_at: record.fields.updatedAt
    })),
    draft_evidence_links: matching(RECORD_TYPES.draftEvidenceLink).map((record) => ({
      id: record.recordName,
      project_id: record.fields.projectId,
      evidence_block_id: record.fields.evidenceBlockId,
      selected_text: record.fields.selectedText || "",
      anchor: objectValue(record.fields.anchor),
      draft_revision: record.fields.draftRevision || 1,
      updated_at: record.fields.updatedAt
    })),
    exports: matching(RECORD_TYPES.exportHistory).map((record) => ({
      id: record.recordName,
      project_id: record.fields.projectId,
      type: record.fields.type,
      output: record.fields.output,
      slug: record.fields.slug || "",
      status: record.fields.status || "complete",
      updated_at: record.fields.updatedAt
    })),
    assets: matching(RECORD_TYPES.asset).map((record) => ({
      id: record.recordName,
      project_id: record.fields.projectId,
      kind: record.fields.kind,
      filename: record.fields.filename,
      mime_type: record.fields.mimeType,
      byte_size: record.fields.byteSize || 0,
      checksum: record.fields.checksum || "",
      cloud_asset_id: record.fields.cloudAssetId || "",
      updated_at: record.fields.updatedAt
    })),
    tombstones: matching(RECORD_TYPES.tombstone).map((record) => ({
      id: record.recordName,
      sourceRecordType: record.fields.sourceRecordType,
      sourceRecordName: record.fields.sourceRecordName,
      deletedAt: record.fields.deletedAt || record.fields.updatedAt,
      updated_at: record.fields.updatedAt
    }))
  };
}

export function tombstoneRecord(recordType, id, deletedAt = new Date().toISOString()) {
  return toCloudKitRecord(RECORD_TYPES.tombstone, `${recordType}:${id}`, {
    sourceRecordType: recordType,
    sourceRecordName: id,
    deletedAt
  }, deletedAt);
}

export function resolveConflict(localRecord, remoteRecord) {
  if (!localRecord) return remoteRecord;
  if (!remoteRecord) return localRecord;
  if (localRecord.recordType === RECORD_TYPES.tombstone || remoteRecord.recordType === RECORD_TYPES.tombstone) {
    return newer(localRecord, remoteRecord);
  }
  if (localRecord.recordType === RECORD_TYPES.evidenceState) {
    const winner = newer(localRecord, remoteRecord);
    return {
      ...winner,
      fields: {
        ...winner.fields,
        checked: Boolean(localRecord.fields.checked || remoteRecord.fields.checked),
        priority: Math.max(localRecord.fields.priority || 0, remoteRecord.fields.priority || 0)
      }
    };
  }
  if (localRecord.recordType === RECORD_TYPES.draft) {
    const localRevision = localRecord.fields.revision || 1;
    const remoteRevision = remoteRecord.fields.revision || 1;
    if (localRevision !== remoteRevision) return localRevision > remoteRevision ? localRecord : remoteRecord;
  }
  return newer(localRecord, remoteRecord);
}

function newer(a, b) {
  return new Date(a.fields.updatedAt || 0) >= new Date(b.fields.updatedAt || 0) ? a : b;
}
