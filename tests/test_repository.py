from __future__ import annotations

import pytest

from backend.app.repository import EpistemeRepository, RepositoryError, ResourceNotFound


def test_project_block_edge_reference_flow(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")

    project = repo.create_project(
        {
            "question": "Why do humans trust confident AI?",
            "interest": "Confidence can look like correctness.",
            "tags": ["ai", "trust"],
        }
    )
    assert project["title"] == "Why do humans trust confident AI?"
    assert project["stage"] == "Seed"

    claim = repo.create_block(
        project["id"],
        {
            "type": "claim",
            "content": "Humans often read fluency as authority.",
            "metadata": {"section": "thesis"},
        },
    )
    evidence = repo.create_block(
        project["id"],
        {
            "type": "evidence",
            "content": "Overconfident explanations are rated as more persuasive.",
        },
    )
    edge = repo.create_edge(
        project["id"],
        {
            "source_id": evidence["id"],
            "target_id": claim["id"],
            "relation_type": "evidence_for",
        },
    )
    reference = repo.create_reference(
        project["id"],
        {
            "title": "Confidence and Persuasion",
            "authors": ["A. Researcher"],
            "url": "https://example.com/paper",
            "notes": "Useful for calibration framing.",
        },
    )

    bundle = repo.get_project_bundle(project["id"])
    assert bundle["project"]["tags"] == ["ai", "trust"]
    assert [block["type"] for block in bundle["blocks"]] == ["claim", "evidence"]
    assert bundle["edges"] == [edge]
    assert bundle["references"] == [reference]

    graph = repo.get_graph(project["id"])
    assert {node["id"] for node in graph["nodes"]} == {claim["id"], evidence["id"]}
    assert graph["edges"][0]["relation_type"] == "evidence_for"


def test_project_updates_and_filters(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    first = repo.create_project({"question": "Question one?", "tags": ["biology"]})
    repo.create_project({"question": "Question two?", "stage": "Drafting", "tags": ["ai"]})

    updated = repo.update_project(
        first["id"],
        {"stage": "Exploration", "progress": 35, "thesis": "A sharper claim."},
    )
    assert updated["stage"] == "Exploration"
    assert updated["progress"] == 35

    assert len(repo.list_projects(stage="Exploration")) == 1
    assert len(repo.list_projects(tag="ai")) == 1


def test_invalid_domain_inputs_raise_repository_errors(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "What is trust?"})
    block = repo.create_block(project["id"], {"type": "claim", "content": "Trust compresses risk."})

    with pytest.raises(RepositoryError):
        repo.create_project({"question": "Broken", "stage": "Planning"})

    with pytest.raises(RepositoryError):
        repo.create_block(project["id"], {"type": "task", "content": "Not a semantic block."})

    with pytest.raises(RepositoryError):
        repo.create_edge(
            project["id"],
            {"source_id": block["id"], "target_id": block["id"], "relation_type": "supports"},
        )


def test_deleting_block_cascades_edges(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "How do ideas connect?"})
    source = repo.create_block(project["id"], {"type": "claim", "content": "A claim."})
    target = repo.create_block(project["id"], {"type": "evidence", "content": "Some evidence."})
    repo.create_edge(
        project["id"],
        {"source_id": source["id"], "target_id": target["id"], "relation_type": "supports"},
    )

    repo.delete_block(source["id"])

    assert repo.list_edges(project["id"]) == []


def test_article_draft_links_selected_text_to_evidence_and_checks_it(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "How should evidence support drafting?"})
    evidence = repo.create_block(
        project["id"],
        {"type": "evidence", "content": "Readers trust claims with visible support."},
    )

    draft = repo.save_article_draft(
        project["id"],
        {
            "content": "Trust grows when a claim carries support.",
            "content_format": "markdown",
        },
    )
    assert draft["revision"] == 2

    link = repo.create_draft_evidence_link(
        project["id"],
        {
            "evidence_block_id": evidence["id"],
            "selected_text": "claim carries support",
            "anchor": {"from": 19, "to": 40, "blockId": "paragraph-1"},
        },
    )

    assert link["anchor"]["from"] == 19
    assert repo.get_evidence(evidence["id"])["checked"] is True
    assert repo.list_evidence(project["id"], checked=False)["items"] == []
    assert repo.list_draft_evidence_links(project["id"])[0]["id"] == link["id"]


def test_draft_autosave_does_not_change_project_stage(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "Can saves race tab changes?", "stage": "Publishing"})
    evidence = repo.create_block(project["id"], {"type": "evidence", "content": "A useful source."})

    repo.save_article_draft(project["id"], {"content": "A finished draft.", "content_format": "markdown"})
    repo.create_draft_evidence_link(project["id"], {"evidence_block_id": evidence["id"], "selected_text": "finished"})

    assert repo.get_project(project["id"])["stage"] == "Publishing"


def test_evidence_priority_orders_unchecked_evidence_for_scroll_panel(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "Which evidence should come next?"})
    low = repo.create_block(project["id"], {"type": "evidence", "content": "Lower priority."})
    high = repo.create_block(project["id"], {"type": "evidence", "content": "Higher priority."})

    repo.update_evidence_state(low["id"], {"priority": 10})
    repo.update_evidence_state(high["id"], {"priority": 80})

    page = repo.list_evidence(project["id"], checked=False, limit=1, offset=0)

    assert page["total"] == 2
    assert page["items"][0]["id"] == high["id"]
    assert page["items"][0]["priority"] == 80


def test_deleting_last_draft_evidence_link_unchecks_evidence(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "When is evidence used?"})
    evidence = repo.create_block(project["id"], {"type": "evidence", "content": "Linked once."})
    link = repo.create_draft_evidence_link(
        project["id"],
        {"evidence_block_id": evidence["id"], "selected_text": "important sentence"},
    )

    repo.delete_draft_evidence_link(link["id"])

    assert repo.get_evidence(evidence["id"])["checked"] is False
    assert repo.get_project_bundle(project["id"])["evidence"][0]["checked"] is False


def test_deleting_project_removes_it_from_repository(tmp_path):
    repo = EpistemeRepository(tmp_path / "episteme.sqlite3")
    project = repo.create_project({"question": "Should this project be removable?"})

    repo.delete_project(project["id"])

    assert repo.list_projects() == []
    with pytest.raises(ResourceNotFound):
        repo.get_project(project["id"])
