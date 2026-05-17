from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from pydantic import BaseModel, Field

from backend.app.config import Settings, load_settings
from backend.app.exports import render_project_json, render_project_markdown, slugify
from backend.app.repository import EpistemeRepository, RepositoryError, ResourceNotFound


class ProjectCreate(BaseModel):
    title: str | None = None
    question: str
    interest: str | None = None
    output_type: str | None = "article"
    thesis: str | None = None
    stage: str | None = "Seed"
    tags: list[str] = Field(default_factory=list)


class ProjectUpdate(BaseModel):
    title: str | None = None
    question: str | None = None
    interest: str | None = None
    output_type: str | None = None
    thesis: str | None = None
    stage: str | None = None
    tags: list[str] | None = None
    progress: int | None = None
    export_status: str | None = None
    archived: bool | None = None


class BlockCreate(BaseModel):
    type: str = "observation"
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    links: list[str] = Field(default_factory=list)


class BlockUpdate(BaseModel):
    type: str | None = None
    content: str | None = None
    metadata: dict[str, Any] | None = None
    links: list[str] | None = None


class EdgeCreate(BaseModel):
    source_id: str
    target_id: str
    relation_type: str = "supports"


class ReferenceCreate(BaseModel):
    title: str
    authors: list[str] = Field(default_factory=list)
    url: str | None = None
    notes: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ReferenceUpdate(BaseModel):
    title: str | None = None
    authors: list[str] | None = None
    url: str | None = None
    notes: str | None = None
    metadata: dict[str, Any] | None = None


class ArticleDraftSave(BaseModel):
    content: str = ""
    content_format: str = "markdown"


class EvidenceStateUpdate(BaseModel):
    priority: int | None = None
    checked: bool | None = None
    notes: str | None = None


class DraftEvidenceLinkCreate(BaseModel):
    evidence_block_id: str
    selected_text: str
    anchor: dict[str, Any] = Field(default_factory=dict)
    draft_revision: int | None = None


class ExportCreate(BaseModel):
    type: str = "markdown"


@lru_cache
def get_settings() -> Settings:
    return load_settings()


@lru_cache
def get_repository() -> EpistemeRepository:
    settings = get_settings()
    return EpistemeRepository(settings.db_path)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Episteme API",
        version="0.1.0",
        description="Backend API for local-first curiosity research projects.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app


app = create_app()


def clean_payload(model: BaseModel) -> dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_unset=True)
    return model.dict(exclude_unset=True)


def translate_errors(error: Exception) -> HTTPException:
    if isinstance(error, ResourceNotFound):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    if isinstance(error, RepositoryError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected error")


@app.get("/health")
def health(repo: EpistemeRepository = Depends(get_repository)) -> dict[str, str]:
    repo.list_projects()
    return {"status": "ok"}


@app.get("/projects")
def list_projects(
    stage: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    include_archived: bool = Query(default=False),
    repo: EpistemeRepository = Depends(get_repository),
) -> list[dict]:
    try:
        return repo.list_projects(stage=stage, tag=tag, include_archived=include_archived)
    except Exception as error:
        raise translate_errors(error) from error


@app.post("/projects", status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.create_project(clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.get("/projects/{project_id}")
def get_project(
    project_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.get_project_bundle(project_id)
    except Exception as error:
        raise translate_errors(error) from error


@app.patch("/projects/{project_id}")
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.update_project(project_id, clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> Response:
    try:
        repo.delete_project(project_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as error:
        raise translate_errors(error) from error


@app.get("/projects/{project_id}/blocks")
def list_blocks(
    project_id: str,
    type: str | None = Query(default=None),
    repo: EpistemeRepository = Depends(get_repository),
) -> list[dict]:
    try:
        return repo.list_blocks(project_id, block_type=type)
    except Exception as error:
        raise translate_errors(error) from error


@app.post("/projects/{project_id}/blocks", status_code=status.HTTP_201_CREATED)
def create_block(
    project_id: str,
    payload: BlockCreate,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.create_block(project_id, clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.patch("/blocks/{block_id}")
def update_block(
    block_id: str,
    payload: BlockUpdate,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.update_block(block_id, clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.delete("/blocks/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_block(
    block_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> Response:
    try:
        repo.delete_block(block_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as error:
        raise translate_errors(error) from error


@app.get("/projects/{project_id}/edges")
def list_edges(
    project_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> list[dict]:
    try:
        return repo.list_edges(project_id)
    except Exception as error:
        raise translate_errors(error) from error


@app.post("/projects/{project_id}/edges", status_code=status.HTTP_201_CREATED)
def create_edge(
    project_id: str,
    payload: EdgeCreate,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.create_edge(project_id, clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.delete("/edges/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_edge(
    edge_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> Response:
    try:
        repo.delete_edge(edge_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as error:
        raise translate_errors(error) from error


@app.get("/projects/{project_id}/references")
def list_references(
    project_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> list[dict]:
    try:
        return repo.list_references(project_id)
    except Exception as error:
        raise translate_errors(error) from error


@app.post("/projects/{project_id}/references", status_code=status.HTTP_201_CREATED)
def create_reference(
    project_id: str,
    payload: ReferenceCreate,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.create_reference(project_id, clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.patch("/references/{reference_id}")
def update_reference(
    reference_id: str,
    payload: ReferenceUpdate,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.update_reference(reference_id, clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.delete("/references/{reference_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reference(
    reference_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> Response:
    try:
        repo.delete_reference(reference_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as error:
        raise translate_errors(error) from error


@app.get("/projects/{project_id}/graph")
def get_graph(
    project_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.get_graph(project_id)
    except Exception as error:
        raise translate_errors(error) from error


@app.get("/projects/{project_id}/draft")
def get_article_draft(
    project_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.get_article_draft(project_id)
    except Exception as error:
        raise translate_errors(error) from error


@app.put("/projects/{project_id}/draft")
def save_article_draft(
    project_id: str,
    payload: ArticleDraftSave,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.save_article_draft(project_id, clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.get("/projects/{project_id}/evidence")
def list_evidence(
    project_id: str,
    checked: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.list_evidence(project_id, checked=checked, limit=limit, offset=offset)
    except Exception as error:
        raise translate_errors(error) from error


@app.patch("/evidence/{block_id}")
def update_evidence_state(
    block_id: str,
    payload: EvidenceStateUpdate,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.update_evidence_state(block_id, clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.get("/projects/{project_id}/draft/evidence-links")
def list_draft_evidence_links(
    project_id: str,
    evidence_block_id: str | None = Query(default=None),
    repo: EpistemeRepository = Depends(get_repository),
) -> list[dict]:
    try:
        return repo.list_draft_evidence_links(project_id, evidence_block_id=evidence_block_id)
    except Exception as error:
        raise translate_errors(error) from error


@app.post("/projects/{project_id}/draft/evidence-links", status_code=status.HTTP_201_CREATED)
def create_draft_evidence_link(
    project_id: str,
    payload: DraftEvidenceLinkCreate,
    repo: EpistemeRepository = Depends(get_repository),
) -> dict:
    try:
        return repo.create_draft_evidence_link(project_id, clean_payload(payload))
    except Exception as error:
        raise translate_errors(error) from error


@app.delete("/draft/evidence-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft_evidence_link(
    link_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> Response:
    try:
        repo.delete_draft_evidence_link(link_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as error:
        raise translate_errors(error) from error


@app.get("/projects/{project_id}/exports")
def list_exports(
    project_id: str,
    repo: EpistemeRepository = Depends(get_repository),
) -> list[dict]:
    try:
        return repo.list_exports(project_id)
    except Exception as error:
        raise translate_errors(error) from error


@app.post("/projects/{project_id}/exports")
def create_export(
    project_id: str,
    payload: ExportCreate,
    repo: EpistemeRepository = Depends(get_repository),
) -> Response:
    try:
        bundle = repo.get_project_bundle(project_id)
        project_slug = slugify(bundle["project"]["title"])
        if payload.type == "markdown":
            artifact = render_project_markdown(bundle)
            record = repo.record_export(project_id, "markdown", f"{project_slug}.md")
            return PlainTextResponse(
                artifact,
                headers={
                    "X-Episteme-Export-Id": record["id"],
                    "Content-Disposition": f'attachment; filename="{project_slug}.md"',
                },
            )
        if payload.type == "json":
            artifact = render_project_json(bundle)
            record = repo.record_export(project_id, "json", f"{project_slug}.json")
            return JSONResponse(
                content={"artifact": json.loads(artifact), "export": record},
                headers={
                    "X-Episteme-Export-Id": record["id"],
                    "Content-Disposition": f'attachment; filename="{project_slug}.json"',
                },
            )
        raise RepositoryError("Export type must be markdown or json.")
    except Exception as error:
        raise translate_errors(error) from error
