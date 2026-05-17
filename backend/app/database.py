from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Iterator


SCHEMA_VERSION = 2


def connect(db_path: str | Path) -> sqlite3.Connection:
    connection = sqlite3.connect(str(db_path))
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db(db_path: str | Path) -> None:
    path = Path(db_path)
    if path.parent and str(path.parent) not in ("", "."):
        path.parent.mkdir(parents=True, exist_ok=True)

    with connect(path) as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                question TEXT NOT NULL,
                interest TEXT NOT NULL DEFAULT '',
                output_type TEXT NOT NULL DEFAULT 'article',
                thesis TEXT NOT NULL DEFAULT '',
                stage TEXT NOT NULL DEFAULT 'Seed',
                tags TEXT NOT NULL DEFAULT '[]',
                progress INTEGER NOT NULL DEFAULT 0,
                export_status TEXT NOT NULL DEFAULT 'not_exported',
                archived INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS blocks (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                type TEXT NOT NULL,
                content TEXT NOT NULL,
                metadata TEXT NOT NULL DEFAULT '{}',
                links TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_blocks_project_id ON blocks(project_id);
            CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(type);

            CREATE TABLE IF NOT EXISTS edges (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                source_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                relation_type TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (source_id) REFERENCES blocks(id) ON DELETE CASCADE,
                FOREIGN KEY (target_id) REFERENCES blocks(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_edges_project_id ON edges(project_id);
            CREATE INDEX IF NOT EXISTS idx_edges_source_id ON edges(source_id);
            CREATE INDEX IF NOT EXISTS idx_edges_target_id ON edges(target_id);

            CREATE TABLE IF NOT EXISTS project_references (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                title TEXT NOT NULL,
                authors TEXT NOT NULL DEFAULT '[]',
                url TEXT NOT NULL DEFAULT '',
                notes TEXT NOT NULL DEFAULT '',
                metadata TEXT NOT NULL DEFAULT '{}',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_references_project_id
                ON project_references(project_id);

            CREATE TABLE IF NOT EXISTS export_history (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                type TEXT NOT NULL,
                artifact_name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_export_history_project_id
                ON export_history(project_id);

            CREATE TABLE IF NOT EXISTS article_drafts (
                project_id TEXT PRIMARY KEY,
                content TEXT NOT NULL DEFAULT '',
                content_format TEXT NOT NULL DEFAULT 'markdown',
                revision INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS evidence_states (
                block_id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                priority INTEGER NOT NULL DEFAULT 0,
                checked INTEGER NOT NULL DEFAULT 0,
                notes TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_evidence_states_project_checked_priority
                ON evidence_states(project_id, checked, priority DESC);

            CREATE TABLE IF NOT EXISTS draft_evidence_links (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                evidence_block_id TEXT NOT NULL,
                selected_text TEXT NOT NULL,
                anchor TEXT NOT NULL DEFAULT '{}',
                draft_revision INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (evidence_block_id) REFERENCES blocks(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_draft_evidence_links_project_id
                ON draft_evidence_links(project_id);
            CREATE INDEX IF NOT EXISTS idx_draft_evidence_links_evidence_block_id
                ON draft_evidence_links(evidence_block_id);
            """
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO schema_migrations (version, applied_at)
            VALUES (?, datetime('now'))
            """,
            (SCHEMA_VERSION,),
        )


def rows_to_dicts(rows: Iterator[sqlite3.Row] | list[sqlite3.Row]) -> list[dict]:
    return [dict(row) for row in rows]
