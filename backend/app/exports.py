from __future__ import annotations

import json
import re
from collections import defaultdict
from typing import Any


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "project"


def render_project_json(bundle: dict[str, Any]) -> str:
    payload = {
        "schema_version": 1,
        **bundle,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def render_project_markdown(bundle: dict[str, Any]) -> str:
    project = bundle["project"]
    blocks = bundle["blocks"]
    references = bundle["references"]
    edges = bundle["edges"]
    draft = bundle.get("draft", {})
    draft_links = bundle.get("draft_evidence_links", [])

    lines = [
        f"# {project['title']}",
        "",
        f"> {project['question']}",
        "",
        "## Project",
        "",
        f"- Stage: {project['stage']}",
        f"- Progress: {project['progress']}%",
        f"- Thesis: {project['thesis'] or 'Unformed'}",
        f"- Tags: {', '.join(project['tags']) if project['tags'] else 'None'}",
        "",
    ]

    if project.get("interest"):
        lines.extend(["## Why This Matters", "", project["interest"], ""])

    if draft.get("content"):
        lines.extend(["## Article Draft", "", draft["content"], ""])

        if draft_links:
            evidence_lookup = {block["id"]: block for block in blocks if block["type"] == "evidence"}
            lines.extend(["### Linked Evidence", ""])
            for link in draft_links:
                evidence = evidence_lookup.get(link["evidence_block_id"], {})
                lines.append(
                    "- "
                    f"\"{_preview(link['selected_text'])}\" -> "
                    f"{_preview(evidence.get('content', link['evidence_block_id']))}"
                )
            lines.append("")

    lines.extend(["## Semantic Blocks", ""])
    blocks_by_type: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for block in blocks:
        blocks_by_type[block["type"]].append(block)

    if blocks_by_type:
        for block_type, typed_blocks in sorted(blocks_by_type.items()):
            lines.extend([f"### {block_type.replace('_', ' ').title()}", ""])
            for block in typed_blocks:
                lines.extend([f"- {block['content']}", ""])
    else:
        lines.extend(["No blocks captured yet.", ""])

    lines.extend(["## Concept Graph", ""])
    if edges:
        block_lookup = {block["id"]: block for block in blocks}
        for edge in edges:
            source = block_lookup.get(edge["source_id"], {})
            target = block_lookup.get(edge["target_id"], {})
            lines.append(
                "- "
                f"{_preview(source.get('content', edge['source_id']))} "
                f"--{edge['relation_type']}--> "
                f"{_preview(target.get('content', edge['target_id']))}"
            )
        lines.append("")
    else:
        lines.extend(["No graph relations captured yet.", ""])

    lines.extend(["## References", ""])
    if references:
        for reference in references:
            authors = ", ".join(reference["authors"])
            prefix = f"{authors}. " if authors else ""
            url = f" {reference['url']}" if reference["url"] else ""
            lines.append(f"- {prefix}{reference['title']}.{url}".strip())
            if reference.get("notes"):
                lines.append(f"  - Notes: {reference['notes']}")
        lines.append("")
    else:
        lines.extend(["No references captured yet.", ""])

    return "\n".join(lines).strip() + "\n"


def _preview(value: str, limit: int = 80) -> str:
    compact = " ".join(value.split())
    if len(compact) <= limit:
        return compact
    return f"{compact[: limit - 1]}..."
