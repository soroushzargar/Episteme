from __future__ import annotations

import json

from backend.app.exports import render_project_json, render_project_markdown, slugify
from backend.app.repository import EpistemeRepository


def test_markdown_export_contains_project_sections(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project(
        {
            "question": "Why does confidence persuade?",
            "thesis": "Confidence is processed as a proxy for competence.",
            "tags": ["psychology"],
        }
    )
    repo.create_block(project["id"], {"type": "claim", "content": "Confidence changes trust."})
    repo.create_reference(project["id"], {"title": "Trust Paper", "authors": ["Jane Doe"]})

    markdown = render_project_markdown(repo.get_project_bundle(project["id"]))

    assert "# Why does confidence persuade?" in markdown
    assert "## Semantic Blocks" in markdown
    assert "Confidence changes trust." in markdown
    assert "Jane Doe. Trust Paper." in markdown


def test_json_export_is_machine_readable(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "What makes a question researchable?"})

    parsed = json.loads(render_project_json(repo.get_project_bundle(project["id"])))

    assert parsed["schema_version"] == 1
    assert parsed["project"]["id"] == project["id"]
    assert parsed["blocks"] == []


def test_record_export_updates_history_and_slugifies_name(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "What is a useful title?"})
    artifact_name = f"{slugify(project['title'])}.md"

    record = repo.record_export(project["id"], "markdown", artifact_name)

    assert record["artifact_name"] == "what-is-a-useful-title.md"
    assert repo.list_exports(project["id"])[0]["id"] == record["id"]
    assert repo.get_project(project["id"])["export_status"] == "markdown_exported"


def test_markdown_export_contains_article_draft_and_linked_evidence(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "How does the draft use evidence?"})
    evidence = repo.create_block(project["id"], {"type": "evidence", "content": "A cited finding."})
    repo.save_article_draft(project["id"], {"content": "This sentence cites a finding."})
    repo.create_draft_evidence_link(
        project["id"],
        {"evidence_block_id": evidence["id"], "selected_text": "cites a finding"},
    )

    markdown = render_project_markdown(repo.get_project_bundle(project["id"]))

    assert "## Article Draft" in markdown
    assert "This sentence cites a finding." in markdown
    assert "### Linked Evidence" in markdown
    assert "cites a finding" in markdown
