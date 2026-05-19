from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from backend.app.database import connect, init_db, rows_to_dicts
from backend.app.models import BLOCK_TYPES, EDGE_TYPES, EXPORT_TYPES, STAGES


class RepositoryError(ValueError):
    """Raised when a request is valid JSON but invalid domain input."""


class ResourceNotFound(KeyError):
    """Raised when a requested entity does not exist."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex}"


def encode_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def decode_json(value: str | None, default: Any) -> Any:
    if value is None or value == "":
        return default
    return json.loads(value)


def hydrate_project(row: dict) -> dict:
    row["tags"] = decode_json(row.get("tags"), [])
    row["archived"] = bool(row.get("archived"))
    return row


def hydrate_block(row: dict) -> dict:
    row["metadata"] = decode_json(row.get("metadata"), {})
    row["links"] = decode_json(row.get("links"), [])
    return row


def hydrate_reference(row: dict) -> dict:
    row["authors"] = decode_json(row.get("authors"), [])
    row["metadata"] = decode_json(row.get("metadata"), {})
    return row


def hydrate_draft_link(row: dict) -> dict:
    row["anchor"] = decode_json(row.get("anchor"), {})
    return row


def hydrate_evidence(row: dict) -> dict:
    row = hydrate_block(row)
    row["priority"] = int(row.get("priority") or 0)
    row["checked"] = bool(row.get("checked") or False)
    row["evidence_notes"] = row.get("evidence_notes") or ""
    return row


class EpistemeRepository:
    def __init__(self, db_path: str | Path):
        self.db_path = Path(db_path)
        init_db(self.db_path)

    def _connect(self) -> sqlite3.Connection:
        return connect(self.db_path)

    def create_project(self, payload: dict[str, Any]) -> dict:
        question = str(payload.get("question", "")).strip()
        if not question:
            raise RepositoryError("Project question is required.")

        now = utc_now()
        project = {
            "id": payload.get("id") or new_id("proj"),
            "title": str(payload.get("title") or question).strip(),
            "question": question,
            "interest": str(payload.get("interest") or "").strip(),
            "output_type": str(payload.get("output_type") or "article").strip(),
            "thesis": str(payload.get("thesis") or "").strip(),
            "stage": payload.get("stage") or "Seed",
            "tags": list(payload.get("tags") or []),
            "progress": int(payload.get("progress") or 0),
            "export_status": str(payload.get("export_status") or "not_exported"),
            "archived": bool(payload.get("archived") or False),
            "created_at": payload.get("created_at") or now,
            "updated_at": payload.get("updated_at") or now,
        }
        self._validate_stage(project["stage"])
        self._validate_progress(project["progress"])

        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO projects (
                    id, title, question, interest, output_type, thesis, stage, tags,
                    progress, export_status, archived, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project["id"],
                    project["title"],
                    project["question"],
                    project["interest"],
                    project["output_type"],
                    project["thesis"],
                    project["stage"],
                    encode_json(project["tags"]),
                    project["progress"],
                    project["export_status"],
                    int(project["archived"]),
                    project["created_at"],
                    project["updated_at"],
                ),
            )
        return project

    def list_projects(
        self,
        *,
        stage: str | None = None,
        tag: str | None = None,
        include_archived: bool = False,
    ) -> list[dict]:
        params: list[Any] = []
        filters: list[str] = []
        if not include_archived:
            filters.append("archived = 0")
        if stage:
            self._validate_stage(stage)
            filters.append("stage = ?")
            params.append(stage)

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
        with self._connect() as connection:
            rows = rows_to_dicts(
                connection.execute(
                    f"""
                    SELECT * FROM projects
                    {where_clause}
                    ORDER BY updated_at DESC
                    """,
                    params,
                ).fetchall()
            )

        projects = [hydrate_project(row) for row in rows]
        if tag:
            projects = [project for project in projects if tag in project["tags"]]
        return projects

    def get_project(self, project_id: str) -> dict:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if row is None:
            raise ResourceNotFound(f"Project not found: {project_id}")
        return hydrate_project(dict(row))

    def update_project(self, project_id: str, payload: dict[str, Any]) -> dict:
        self.get_project(project_id)
        allowed = {
            "title",
            "question",
            "interest",
            "output_type",
            "thesis",
            "stage",
            "tags",
            "progress",
            "export_status",
            "archived",
        }
        changes = {key: value for key, value in payload.items() if key in allowed}
        if not changes:
            return self.get_project(project_id)

        if "stage" in changes:
            self._validate_stage(changes["stage"])
        if "progress" in changes:
            changes["progress"] = int(changes["progress"])
            self._validate_progress(changes["progress"])
        if "tags" in changes:
            changes["tags"] = encode_json(list(changes["tags"] or []))
        if "archived" in changes:
            changes["archived"] = int(bool(changes["archived"]))
        changes["updated_at"] = utc_now()

        assignments = ", ".join(f"{key} = ?" for key in changes)
        params = list(changes.values()) + [project_id]
        with self._connect() as connection:
            connection.execute(f"UPDATE projects SET {assignments} WHERE id = ?", params)
        return self.get_project(project_id)

    def delete_project(self, project_id: str) -> None:
        self.get_project(project_id)
        with self._connect() as connection:
            connection.execute("DELETE FROM projects WHERE id = ?", (project_id,))

    def create_block(self, project_id: str, payload: dict[str, Any]) -> dict:
        self.get_project(project_id)
        block_type = payload.get("type") or "observation"
        self._validate_block_type(block_type)
        content = str(payload.get("content") or "").strip()
        if not content:
            raise RepositoryError("Block content is required.")

        now = utc_now()
        block = {
            "id": payload.get("id") or new_id("block"),
            "project_id": project_id,
            "type": block_type,
            "content": content,
            "metadata": dict(payload.get("metadata") or {}),
            "links": list(payload.get("links") or []),
            "created_at": payload.get("created_at") or now,
            "updated_at": payload.get("updated_at") or now,
        }

        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO blocks (
                    id, project_id, type, content, metadata, links, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    block["id"],
                    block["project_id"],
                    block["type"],
                    block["content"],
                    encode_json(block["metadata"]),
                    encode_json(block["links"]),
                    block["created_at"],
                    block["updated_at"],
                ),
            )
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (utc_now(), project_id),
            )
            if block["type"] == "evidence":
                connection.execute(
                    """
                    INSERT OR IGNORE INTO evidence_states (
                        block_id, project_id, priority, checked, notes, created_at, updated_at
                    )
                    VALUES (?, ?, 0, 0, '', ?, ?)
                    """,
                    (block["id"], project_id, now, now),
                )
        return block

    def list_blocks(self, project_id: str, *, block_type: str | None = None) -> list[dict]:
        self.get_project(project_id)
        params: list[Any] = [project_id]
        type_clause = ""
        if block_type:
            self._validate_block_type(block_type)
            type_clause = "AND type = ?"
            params.append(block_type)
        with self._connect() as connection:
            rows = rows_to_dicts(
                connection.execute(
                    f"""
                    SELECT * FROM blocks
                    WHERE project_id = ? {type_clause}
                    ORDER BY created_at ASC
                    """,
                    params,
                ).fetchall()
            )
        return [hydrate_block(row) for row in rows]

    def get_block(self, block_id: str) -> dict:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM blocks WHERE id = ?", (block_id,)).fetchone()
        if row is None:
            raise ResourceNotFound(f"Block not found: {block_id}")
        return hydrate_block(dict(row))

    def update_block(self, block_id: str, payload: dict[str, Any]) -> dict:
        existing = self.get_block(block_id)
        allowed = {"type", "content", "metadata", "links"}
        changes = {key: value for key, value in payload.items() if key in allowed}
        if not changes:
            return existing

        old_type = existing["type"]
        if "type" in changes:
            self._validate_block_type(changes["type"])
        if "content" in changes and not str(changes["content"]).strip():
            raise RepositoryError("Block content cannot be empty.")
        if "metadata" in changes:
            changes["metadata"] = encode_json(dict(changes["metadata"] or {}))
        if "links" in changes:
            changes["links"] = encode_json(list(changes["links"] or []))
        changes["updated_at"] = utc_now()

        assignments = ", ".join(f"{key} = ?" for key in changes)
        params = list(changes.values()) + [block_id]
        with self._connect() as connection:
            connection.execute(f"UPDATE blocks SET {assignments} WHERE id = ?", params)
            next_type = changes.get("type", old_type)
            if next_type == "evidence":
                now = utc_now()
                connection.execute(
                    """
                    INSERT OR IGNORE INTO evidence_states (
                        block_id, project_id, priority, checked, notes, created_at, updated_at
                    )
                    VALUES (?, ?, 0, 0, '', ?, ?)
                    """,
                    (block_id, existing["project_id"], now, now),
                )
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (utc_now(), existing["project_id"]),
            )
        return self.get_block(block_id)

    def delete_block(self, block_id: str) -> None:
        existing = self.get_block(block_id)
        with self._connect() as connection:
            connection.execute("DELETE FROM blocks WHERE id = ?", (block_id,))
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (utc_now(), existing["project_id"]),
            )

    def create_edge(self, project_id: str, payload: dict[str, Any]) -> dict:
        self.get_project(project_id)
        source_id = str(payload.get("source_id") or "")
        target_id = str(payload.get("target_id") or "")
        relation_type = payload.get("relation_type") or "supports"
        self._validate_edge_type(relation_type)
        if source_id == target_id:
            raise RepositoryError("An edge must connect two different blocks.")
        source = self.get_block(source_id)
        target = self.get_block(target_id)
        if source["project_id"] != project_id or target["project_id"] != project_id:
            raise RepositoryError("Both edge endpoints must belong to the project.")

        now = utc_now()
        edge = {
            "id": payload.get("id") or new_id("edge"),
            "project_id": project_id,
            "source_id": source_id,
            "target_id": target_id,
            "relation_type": relation_type,
            "created_at": payload.get("created_at") or now,
        }
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO edges (id, project_id, source_id, target_id, relation_type, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    edge["id"],
                    edge["project_id"],
                    edge["source_id"],
                    edge["target_id"],
                    edge["relation_type"],
                    edge["created_at"],
                ),
            )
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (utc_now(), project_id),
            )
        return edge

    def list_edges(self, project_id: str) -> list[dict]:
        self.get_project(project_id)
        with self._connect() as connection:
            return rows_to_dicts(
                connection.execute(
                    "SELECT * FROM edges WHERE project_id = ? ORDER BY created_at ASC",
                    (project_id,),
                ).fetchall()
            )

    def delete_edge(self, edge_id: str) -> None:
        edge = self.get_edge(edge_id)
        with self._connect() as connection:
            connection.execute("DELETE FROM edges WHERE id = ?", (edge_id,))
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (utc_now(), edge["project_id"]),
            )

    def get_edge(self, edge_id: str) -> dict:
        with self._connect() as connection:
            row = connection.execute("SELECT * FROM edges WHERE id = ?", (edge_id,)).fetchone()
        if row is None:
            raise ResourceNotFound(f"Edge not found: {edge_id}")
        return dict(row)

    def create_reference(self, project_id: str, payload: dict[str, Any]) -> dict:
        self.get_project(project_id)
        title = str(payload.get("title") or "").strip()
        if not title:
            raise RepositoryError("Reference title is required.")

        now = utc_now()
        reference = {
            "id": payload.get("id") or new_id("ref"),
            "project_id": project_id,
            "title": title,
            "authors": list(payload.get("authors") or []),
            "url": str(payload.get("url") or "").strip(),
            "notes": str(payload.get("notes") or "").strip(),
            "metadata": dict(payload.get("metadata") or {}),
            "created_at": payload.get("created_at") or now,
            "updated_at": payload.get("updated_at") or now,
        }
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO project_references (
                    id, project_id, title, authors, url, notes, metadata, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    reference["id"],
                    reference["project_id"],
                    reference["title"],
                    encode_json(reference["authors"]),
                    reference["url"],
                    reference["notes"],
                    encode_json(reference["metadata"]),
                    reference["created_at"],
                    reference["updated_at"],
                ),
            )
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (utc_now(), project_id),
            )
        return reference

    def list_references(self, project_id: str) -> list[dict]:
        self.get_project(project_id)
        with self._connect() as connection:
            rows = rows_to_dicts(
                connection.execute(
                    "SELECT * FROM project_references WHERE project_id = ? ORDER BY created_at ASC",
                    (project_id,),
                ).fetchall()
            )
        return [hydrate_reference(row) for row in rows]

    def get_reference(self, reference_id: str) -> dict:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM project_references WHERE id = ?",
                (reference_id,),
            ).fetchone()
        if row is None:
            raise ResourceNotFound(f"Reference not found: {reference_id}")
        return hydrate_reference(dict(row))

    def update_reference(self, reference_id: str, payload: dict[str, Any]) -> dict:
        existing = self.get_reference(reference_id)
        allowed = {"title", "authors", "url", "notes", "metadata"}
        changes = {key: value for key, value in payload.items() if key in allowed}
        if not changes:
            return existing

        if "title" in changes and not str(changes["title"]).strip():
            raise RepositoryError("Reference title cannot be empty.")
        if "authors" in changes:
            changes["authors"] = encode_json(list(changes["authors"] or []))
        if "metadata" in changes:
            changes["metadata"] = encode_json(dict(changes["metadata"] or {}))
        changes["updated_at"] = utc_now()

        assignments = ", ".join(f"{key} = ?" for key in changes)
        params = list(changes.values()) + [reference_id]
        with self._connect() as connection:
            connection.execute(f"UPDATE project_references SET {assignments} WHERE id = ?", params)
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (utc_now(), existing["project_id"]),
            )
        return self.get_reference(reference_id)

    def delete_reference(self, reference_id: str) -> None:
        existing = self.get_reference(reference_id)
        with self._connect() as connection:
            connection.execute("DELETE FROM project_references WHERE id = ?", (reference_id,))
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (utc_now(), existing["project_id"]),
            )

    def get_project_bundle(self, project_id: str) -> dict:
        project = self.get_project(project_id)
        return {
            "project": project,
            "blocks": self.list_blocks(project_id),
            "edges": self.list_edges(project_id),
            "references": self.list_references(project_id),
            "draft": self.get_article_draft(project_id),
            "evidence": self.list_evidence(project_id, limit=200)["items"],
            "draft_evidence_links": self.list_draft_evidence_links(project_id),
            "exports": self.list_exports(project_id),
        }

    def get_article_draft(self, project_id: str) -> dict:
        self.get_project(project_id)
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM article_drafts WHERE project_id = ?",
                (project_id,),
            ).fetchone()
        if row is not None:
            return dict(row)

        now = utc_now()
        draft = {
            "project_id": project_id,
            "content": "",
            "content_format": "markdown",
            "revision": 1,
            "created_at": now,
            "updated_at": now,
        }
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO article_drafts (
                    project_id, content, content_format, revision, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    draft["project_id"],
                    draft["content"],
                    draft["content_format"],
                    draft["revision"],
                    draft["created_at"],
                    draft["updated_at"],
                ),
            )
        return draft

    def save_article_draft(self, project_id: str, payload: dict[str, Any]) -> dict:
        self.get_article_draft(project_id)
        content = str(payload.get("content") or "")
        content_format = str(payload.get("content_format") or "markdown")
        if content_format not in {"markdown", "html", "json"}:
            raise RepositoryError("Draft content format must be markdown, html, or json.")

        now = utc_now()
        with self._connect() as connection:
            connection.execute(
                """
                UPDATE article_drafts
                SET content = ?, content_format = ?, revision = revision + 1, updated_at = ?
                WHERE project_id = ?
                """,
                (content, content_format, now, project_id),
            )
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (now, project_id),
            )
        return self.get_article_draft(project_id)

    def list_evidence(
        self,
        project_id: str,
        *,
        checked: bool | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        self.get_project(project_id)
        if limit < 1 or limit > 200:
            raise RepositoryError("Evidence limit must be between 1 and 200.")
        if offset < 0:
            raise RepositoryError("Evidence offset must be zero or greater.")

        params: list[Any] = [project_id]
        checked_clause = ""
        if checked is not None:
            checked_clause = "AND COALESCE(es.checked, 0) = ?"
            params.append(int(checked))

        count_params = list(params)
        with self._connect() as connection:
            rows = rows_to_dicts(
                connection.execute(
                    f"""
                    SELECT
                        b.*,
                        COALESCE(es.priority, 0) AS priority,
                        COALESCE(es.checked, 0) AS checked,
                        COALESCE(es.notes, '') AS evidence_notes
                    FROM blocks b
                    LEFT JOIN evidence_states es ON es.block_id = b.id
                    WHERE b.project_id = ? AND b.type = 'evidence' {checked_clause}
                    ORDER BY COALESCE(es.checked, 0) ASC,
                             COALESCE(es.priority, 0) DESC,
                             b.created_at ASC
                    LIMIT ? OFFSET ?
                    """,
                    params + [limit, offset],
                ).fetchall()
            )
            total = connection.execute(
                f"""
                SELECT COUNT(*) AS count
                FROM blocks b
                LEFT JOIN evidence_states es ON es.block_id = b.id
                WHERE b.project_id = ? AND b.type = 'evidence' {checked_clause}
                """,
                count_params,
            ).fetchone()["count"]

        return {
            "items": [hydrate_evidence(row) for row in rows],
            "limit": limit,
            "offset": offset,
            "total": total,
        }

    def update_evidence_state(self, block_id: str, payload: dict[str, Any]) -> dict:
        block = self.get_block(block_id)
        if block["type"] != "evidence":
            raise RepositoryError("Only evidence blocks can have evidence state.")

        allowed = {"priority", "checked", "notes"}
        changes = {key: value for key, value in payload.items() if key in allowed}
        if not changes:
            return self.get_evidence(block_id)

        if "priority" in changes:
            changes["priority"] = int(changes["priority"])
            if changes["priority"] < 0 or changes["priority"] > 100:
                raise RepositoryError("Evidence priority must be between 0 and 100.")
        if "checked" in changes:
            changes["checked"] = int(bool(changes["checked"]))
        if "notes" in changes:
            changes["notes"] = str(changes["notes"] or "")

        now = utc_now()
        with self._connect() as connection:
            connection.execute(
                """
                INSERT OR IGNORE INTO evidence_states (
                    block_id, project_id, priority, checked, notes, created_at, updated_at
                )
                VALUES (?, ?, 0, 0, '', ?, ?)
                """,
                (block_id, block["project_id"], now, now),
            )
            changes["updated_at"] = now
            assignments = ", ".join(f"{key} = ?" for key in changes)
            connection.execute(
                f"UPDATE evidence_states SET {assignments} WHERE block_id = ?",
                list(changes.values()) + [block_id],
            )
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (now, block["project_id"]),
            )
        return self.get_evidence(block_id)

    def get_evidence(self, block_id: str) -> dict:
        block = self.get_block(block_id)
        if block["type"] != "evidence":
            raise RepositoryError("Only evidence blocks can be fetched as evidence.")

        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT
                    b.*,
                    COALESCE(es.priority, 0) AS priority,
                    COALESCE(es.checked, 0) AS checked,
                    COALESCE(es.notes, '') AS evidence_notes
                FROM blocks b
                LEFT JOIN evidence_states es ON es.block_id = b.id
                WHERE b.id = ?
                """,
                (block_id,),
            ).fetchone()
        if row is None:
            raise ResourceNotFound(f"Evidence not found: {block_id}")
        return hydrate_evidence(dict(row))

    def create_draft_evidence_link(self, project_id: str, payload: dict[str, Any]) -> dict:
        draft = self.get_article_draft(project_id)
        evidence_block_id = str(payload.get("evidence_block_id") or "")
        evidence = self.get_block(evidence_block_id)
        if evidence["project_id"] != project_id:
            raise RepositoryError("Evidence must belong to the project.")
        if evidence["type"] != "evidence":
            raise RepositoryError("Draft links can only target evidence blocks.")

        selected_text = str(payload.get("selected_text") or "").strip()
        if not selected_text:
            raise RepositoryError("Selected draft text is required.")

        now = utc_now()
        link = {
            "id": payload.get("id") or new_id("draft_link"),
            "project_id": project_id,
            "evidence_block_id": evidence_block_id,
            "selected_text": selected_text,
            "anchor": dict(payload.get("anchor") or {}),
            "draft_revision": int(payload.get("draft_revision") or draft["revision"]),
            "created_at": payload.get("created_at") or now,
            "updated_at": payload.get("updated_at") or now,
        }
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO draft_evidence_links (
                    id, project_id, evidence_block_id, selected_text, anchor,
                    draft_revision, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    link["id"],
                    link["project_id"],
                    link["evidence_block_id"],
                    link["selected_text"],
                    encode_json(link["anchor"]),
                    link["draft_revision"],
                    link["created_at"],
                    link["updated_at"],
                ),
            )
            connection.execute(
                """
                INSERT OR IGNORE INTO evidence_states (
                    block_id, project_id, priority, checked, notes, created_at, updated_at
                )
                VALUES (?, ?, 0, 0, '', ?, ?)
                """,
                (evidence_block_id, project_id, now, now),
            )
            connection.execute(
                "UPDATE evidence_states SET checked = 1, updated_at = ? WHERE block_id = ?",
                (now, evidence_block_id),
            )
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (now, project_id),
            )
        return link

    def list_draft_evidence_links(
        self,
        project_id: str,
        *,
        evidence_block_id: str | None = None,
    ) -> list[dict]:
        self.get_project(project_id)
        params: list[Any] = [project_id]
        evidence_clause = ""
        if evidence_block_id:
            evidence_clause = "AND evidence_block_id = ?"
            params.append(evidence_block_id)
        with self._connect() as connection:
            rows = rows_to_dicts(
                connection.execute(
                    f"""
                    SELECT * FROM draft_evidence_links
                    WHERE project_id = ? {evidence_clause}
                    ORDER BY created_at ASC
                    """,
                    params,
                ).fetchall()
            )
        return [hydrate_draft_link(row) for row in rows]

    def delete_draft_evidence_link(self, link_id: str) -> None:
        link = self.get_draft_evidence_link(link_id)
        with self._connect() as connection:
            connection.execute("DELETE FROM draft_evidence_links WHERE id = ?", (link_id,))
            remaining = connection.execute(
                """
                SELECT COUNT(*) AS count FROM draft_evidence_links
                WHERE evidence_block_id = ?
                """,
                (link["evidence_block_id"],),
            ).fetchone()["count"]
            now = utc_now()
            if remaining == 0:
                connection.execute(
                    "UPDATE evidence_states SET checked = 0, updated_at = ? WHERE block_id = ?",
                    (now, link["evidence_block_id"]),
                )
            connection.execute(
                "UPDATE projects SET updated_at = ? WHERE id = ?",
                (now, link["project_id"]),
            )

    def get_draft_evidence_link(self, link_id: str) -> dict:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM draft_evidence_links WHERE id = ?",
                (link_id,),
            ).fetchone()
        if row is None:
            raise ResourceNotFound(f"Draft evidence link not found: {link_id}")
        return hydrate_draft_link(dict(row))

    def get_graph(self, project_id: str) -> dict:
        blocks = self.list_blocks(project_id)
        edges = self.list_edges(project_id)
        return {
            "nodes": [
                {
                    "id": block["id"],
                    "type": block["type"],
                    "label": block["content"][:80],
                    "content": block["content"],
                    "metadata": block["metadata"],
                }
                for block in blocks
            ],
            "edges": edges,
        }

    def record_export(self, project_id: str, export_type: str, artifact_name: str) -> dict:
        self.get_project(project_id)
        self._validate_export_type(export_type)
        record = {
            "id": new_id("export"),
            "project_id": project_id,
            "type": export_type,
            "artifact_name": artifact_name,
            "created_at": utc_now(),
        }
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO export_history (id, project_id, type, artifact_name, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    record["id"],
                    record["project_id"],
                    record["type"],
                    record["artifact_name"],
                    record["created_at"],
                ),
            )
            connection.execute(
                "UPDATE projects SET export_status = ?, updated_at = ? WHERE id = ?",
                (f"{export_type}_exported", utc_now(), project_id),
            )
        return record

    def list_exports(self, project_id: str) -> list[dict]:
        self.get_project(project_id)
        with self._connect() as connection:
            return rows_to_dicts(
                connection.execute(
                    """
                    SELECT * FROM export_history
                    WHERE project_id = ?
                    ORDER BY created_at DESC
                    """,
                    (project_id,),
                ).fetchall()
            )

    def _validate_stage(self, stage: str) -> None:
        if stage not in STAGES:
            raise RepositoryError(f"Invalid stage '{stage}'. Expected one of: {', '.join(STAGES)}.")

    def _validate_block_type(self, block_type: str) -> None:
        if block_type not in BLOCK_TYPES:
            raise RepositoryError(
                f"Invalid block type '{block_type}'. Expected one of: {', '.join(BLOCK_TYPES)}."
            )

    def _validate_edge_type(self, edge_type: str) -> None:
        if edge_type not in EDGE_TYPES:
            raise RepositoryError(
                f"Invalid relation type '{edge_type}'. Expected one of: {', '.join(EDGE_TYPES)}."
            )

    def _validate_export_type(self, export_type: str) -> None:
        if export_type not in EXPORT_TYPES:
            raise RepositoryError(
                f"Invalid export type '{export_type}'. Expected one of: {', '.join(EXPORT_TYPES)}."
            )

    def _validate_progress(self, progress: int) -> None:
        if progress < 0 or progress > 100:
            raise RepositoryError("Project progress must be between 0 and 100.")
