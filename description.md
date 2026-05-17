# Curiosity-to-Research Studio  
## Product & System Design Specification (V1)

---

# 1. Vision

A software platform that transforms:

```text
curious question
    ↓
structured exploration
    ↓
research synthesis
    ↓
publishable artifact
```

The system is designed around the idea that:

> Every curiosity is a project.

Each project evolves through a research lifecycle while preserving:
- raw thoughts,
- conceptual maps,
- evidence,
- narrative structure,
- article drafts,
- exports.

The application should feel like:

```text
paper + research notebook + semantic graph + article studio
```

NOT:
- a task manager,
- a generic note-taking app,
- a documentation wiki.

---

# 2. Product Philosophy

The core abstraction is NOT a “document”.

The core abstraction is:

```text
Research Project
```

Each project originates from:
- a question,
- confusion,
- contradiction,
- observation,
- hypothesis,
- curiosity.

The software should support:
- messy exploration,
- gradual refinement,
- nonlinear thinking,
- synthesis,
- eventual publication.

---

# 3. Core User Flow

```text
User has curiosity
    ↓
Creates project
    ↓
Captures initial thoughts
    ↓
Explores ideas/literature
    ↓
Builds concept graph
    ↓
Forms thesis
    ↓
Collects evidence
    ↓
Builds article narrative
    ↓
Exports final artifact
```

---

# 4. High-Level Architecture

```text
Frontend:
    React / Next.js / Tailwind

State:
    Zustand or Redux

Local Database:
    IndexedDB (Dexie.js wrapper)

Backend (optional initially):
    None (offline-first architecture)

Export Layer:
    Markdown
    PDF
    JSON
    DOCX (later)

Graph Engine:
    React Flow

Editor:
    TipTap / Lexical / ProseMirror
```

---

# 5. Core Design Principle

The app is:

```text
offline-first
local-first
markdown-native
```

Reason:
- researchers need ownership,
- projects may become large,
- fast iteration matters,
- portability matters,
- markdown longevity matters.

---

# 6. Main Screens

---

# 6.1 Projects Dashboard

## Purpose

Entry point into all curiosity projects.

---

## Layout

```text
---------------------------------------------------
| Sidebar | Main Area                            |
---------------------------------------------------
```

### Sidebar

```text
- All Projects
- Active
- Seeds
- Drafting
- Published
- Archived
- Tags
```

---

## Main Area

Card/grid view.

Each project card contains:

```text
Title
Current thesis
Stage
Last modified
Tags
Progress
Export status
```

Example:

```text
Why do humans trust confident AI?
Stage: Crystallization
Progress: 62%
Last modified: 2h ago
```

---

## Features

### Create Project

Button:
```text
+ New Curiosity
```

Popup:

```text
Question
Why does this interest me?
Possible output type
Tags
```

---

# 6.2 Research Workspace

Upon opening a project:

```text
---------------------------------------------------------
| Left Sidebar | Main Editor | Right Context Panel      |
---------------------------------------------------------
```

---

# 7. Left Sidebar Structure

This represents the research lifecycle.

```text
1. Seed
2. Distillation
3. Exploration
4. Mapping
5. Thesis
6. Evidence
7. Drafting
8. Publishing
```

Each section expands.

---

# 8. Main Workspace

The main workspace is a:

```text
semantic writing surface
```

It behaves like paper.

But blocks are typed.

---

# 9. Semantic Block System

Every block has a type.

Example block types:

```text
Question
Observation
Hypothesis
Claim
Counterargument
Evidence
Experiment
Reference
Analogy
Confusion
Conclusion
Draft Paragraph
```

---

## Example Internal Representation

```json
{
  "id": "block_001",
  "type": "claim",
  "content": "Humans prefer decisiveness over calibration.",
  "links": ["block_045"],
  "created_at": "...",
  "updated_at": "..."
}
```

---

# 10. Right Context Panel

Context-aware assistant layer.

Depending on selected block:

```text
Related blocks
Related papers
Contradictions
Suggested tags
Potential article sections
Open questions
```

---

# 11. Research Lifecycle Sections

---

# 11.1 Seed Phase

Purpose:
capture raw curiosity.

Template:

```markdown
# Initial Curiosity

## Question

## Why does this bother me?

## Current intuition

## What would surprise me?

## Related domains
```

---

# 11.2 Distillation Phase

Purpose:
transform vague question into researchable form.

Template:

```markdown
# Distillation

## Broad Question

## Precise Question

## Researchable Question

## Variables

## Assumptions

## Unknowns
```

---

# 11.3 Exploration Phase

Purpose:
collect ideas without rigid structure.

Includes:
- notes,
- citations,
- links,
- mini-essays,
- screenshots,
- references.

---

# 11.4 Mapping Phase

Purpose:
build conceptual graph.

---

## Graph Node Types

```text
Question
Claim
Theory
Paper
Method
Dataset
Concept
Contradiction
Example
```

---

## Edge Types

```text
supports
contradicts
extends
depends_on
inspired_by
evidence_for
```

---

# 11.5 Thesis Phase

Purpose:
compress exploration into central insight.

Template:

```markdown
# Core Thesis

## Main Claim

## Why existing views are insufficient

## Novel perspective

## Strongest counterargument

## Necessary evidence
```

---

# 11.6 Evidence Phase

Purpose:
gather proof material.

Can include:

```text
Experiments
Code snippets
Charts
Datasets
Interview notes
Simulations
Statistics
References
```

---

# 11.7 Drafting Phase

Purpose:
assemble article.

---

## Article Builder

Drag semantic blocks into sections:

```text
Introduction
Motivation
Background
Problem
Main Insight
Evidence
Counterarguments
Conclusion
```

---

# 11.8 Publishing Phase

Purpose:
export/share.

---

# 12. Export System

Critical feature.

Everything internally should remain:

```text
markdown-first
```

---

# 12.1 Export Formats

## Markdown

Export full project:

```text
/project-name/
    notes.md
    thesis.md
    draft.md
    references.json
    graph.json
```

---

## PDF

Generate:
- article,
- research notebook,
- project summary.

---

## JSON

Machine-readable export.

Useful for:
- backups,
- AI pipelines,
- interoperability.

---

## Future

```text
LaTeX
DOCX
Obsidian vault
Notion sync
Git repo
```

---

# 13. Local Database Design

---

# 13.1 Why Local-First

Because:
- research is personal,
- latency matters,
- ownership matters,
- offline work matters.

---

# 13.2 Database Choice

```text
IndexedDB
```

via:

```text
Dexie.js
```

---

# 13.3 Core Tables

---

## Projects

```ts
Project {
    id
    title
    question
    thesis
    stage
    tags
    createdAt
    updatedAt
}
```

---

## Blocks

```ts
Block {
    id
    projectId
    type
    content
    metadata
    createdAt
    updatedAt
}
```

---

## Edges

```ts
Edge {
    id
    sourceId
    targetId
    relationType
}
```

---

## References

```ts
Reference {
    id
    projectId
    title
    authors
    url
    notes
}
```

---

## Exports

```ts
ExportHistory {
    id
    projectId
    type
    createdAt
}
```

---

# 14. AI Features (Later Phase)

Do NOT make AI the core product.

AI augments the process.

---

## Good AI Features

### Thesis Compression

```text
Summarize exploration into central claim
```

---

### Contradiction Detection

```text
Find conflicting claims
```

---

### Research Gap Detection

```text
What evidence is missing?
```

---

### Article Outline Generation

```text
Generate narrative structure
```

---

### Concept Clustering

```text
Group semantically related blocks
```

---

# 15. UI Philosophy

Minimalist.

Academic.

Calm.

The user should feel:
- intellectually focused,
- not productivity-overwhelmed.

Avoid:
- excessive gamification,
- flashy dashboards,
- corporate PM aesthetics.

Visual references:

```text
Linear
Obsidian
Apple Notes
Notion (minimal parts)
Roam
Research notebooks
Paper margins
```

---

# 16. Suggested Folder Structure

```text
src/
    components/
    editor/
    graph/
    database/
    export/
    ai/
    pages/
    hooks/
    store/

public/

data/

exports/
```

---

# 17. Suggested MVP

Build ONLY:

```text
1. Project dashboard
2. Rich editor
3. Semantic blocks
4. Local database
5. Graph visualization
6. Markdown export
```

Everything else later.

---

# 18. Long-Term Vision

The software becomes:

```text
A cognitive operating system for research thinking.
```

Not merely note-taking.

It should eventually help users:
- think structurally,
- preserve intellectual evolution,
- synthesize ideas,
- generate publishable work.

---

# 19. Core Product Insight

Most tools organize:

```text
documents
```

This software organizes:

```text
thought evolution
```

That is the differentiator.

---

# 20. Suggested First Implementation Order

```text
Phase 1
---------
Projects dashboard
Local DB
Editor
Markdown persistence

Phase 2
---------
Semantic blocks
Graph engine
Block linking

Phase 3
---------
Article builder
Export system

Phase 4
---------
AI assistance
Research synthesis
Gap detection
```

---

# 21. Final Design Principle

The app should feel like:

```text
an intelligent research notebook
```

NOT:

```text
a productivity tool
```

The emotional experience should be:

```text
"I am developing ideas."
```

rather than:

```text
"I am managing tasks."
```

# On the tech choice
Frontend:
    Next.js + React + Tailwind

Desktop Wrapper (optional later):
    Tauri

Backend API:
    FastAPI (Python)

Local Database:
    SQLite initially
    PostgreSQL later if cloud sync is added

Vector Search:
    Qdrant or Chroma

Graph Relations:
    NetworkX initially
    Neo4j later if needed

AI Layer:
    Python ecosystem is strongest here
