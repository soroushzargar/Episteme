from __future__ import annotations

from dataclasses import dataclass
from typing import Final


STAGES: Final[tuple[str, ...]] = (
    "Seed",
    "Distillation",
    "Exploration",
    "Mapping",
    "Thesis",
    "Evidence",
    "Drafting",
    "Publishing",
)

BLOCK_TYPES: Final[tuple[str, ...]] = (
    "question",
    "observation",
    "hypothesis",
    "claim",
    "counterargument",
    "evidence",
    "experiment",
    "reference",
    "analogy",
    "confusion",
    "conclusion",
    "draft_paragraph",
)

GRAPH_NODE_TYPES: Final[tuple[str, ...]] = (
    "question",
    "claim",
    "theory",
    "paper",
    "method",
    "dataset",
    "concept",
    "contradiction",
    "example",
)

EDGE_TYPES: Final[tuple[str, ...]] = (
    "supports",
    "contradicts",
    "extends",
    "depends_on",
    "inspired_by",
    "evidence_for",
)

EXPORT_TYPES: Final[tuple[str, ...]] = ("markdown", "json")


@dataclass(frozen=True)
class NotFound:
    resource: str
    resource_id: str
