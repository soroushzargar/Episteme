from __future__ import annotations


def test_fastapi_app_imports():
    from backend.app.main import app

    assert app.title == "Episteme API"


def test_drafting_api_flow(tmp_path):
    from fastapi.testclient import TestClient

    from backend.app.main import app, get_repository
    from backend.app.repository import EpistemeRepository

    repo = EpistemeRepository(tmp_path / "api.sqlite3")
    app.dependency_overrides[get_repository] = lambda: repo
    client = TestClient(app)

    try:
        project_response = client.post("/projects", json={"question": "How does evidence sync?"})
        project_response.raise_for_status()
        project_id = project_response.json()["id"]

        evidence_response = client.post(
            f"/projects/{project_id}/blocks",
            json={"type": "evidence", "content": "Evidence can be checked by linking it."},
        )
        evidence_response.raise_for_status()
        evidence_id = evidence_response.json()["id"]

        draft_response = client.put(
            f"/projects/{project_id}/draft",
            json={"content": "The article uses this evidence."},
        )
        draft_response.raise_for_status()
        assert draft_response.json()["revision"] == 2

        link_response = client.post(
            f"/projects/{project_id}/draft/evidence-links",
            json={"evidence_block_id": evidence_id, "selected_text": "uses this evidence"},
        )
        link_response.raise_for_status()

        unchecked_response = client.get(f"/projects/{project_id}/evidence?checked=false")
        unchecked_response.raise_for_status()
        assert unchecked_response.json()["items"] == []
    finally:
        app.dependency_overrides.clear()


def test_project_delete_api_flow(tmp_path):
    from fastapi.testclient import TestClient

    from backend.app.main import app, get_repository
    from backend.app.repository import EpistemeRepository

    repo = EpistemeRepository(tmp_path / "api-delete.sqlite3")
    app.dependency_overrides[get_repository] = lambda: repo
    client = TestClient(app)

    try:
        project_response = client.post("/projects", json={"question": "Can a project be deleted?"})
        project_response.raise_for_status()
        project_id = project_response.json()["id"]

        delete_response = client.delete(f"/projects/{project_id}")
        delete_response.raise_for_status()
        assert delete_response.status_code == 204

        missing_response = client.get(f"/projects/{project_id}")
        assert missing_response.status_code == 404
    finally:
        app.dependency_overrides.clear()
