export const CLOUDKIT_SCHEMA_VERSION = 1;

export const RECORD_TYPES = {
  project: "Project",
  block: "Block",
  evidenceState: "EvidenceState",
  draft: "Draft",
  draftEvidenceLink: "DraftEvidenceLink",
  reference: "Reference",
  asset: "Asset",
  exportHistory: "ExportHistory",
  tombstone: "Tombstone"
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
