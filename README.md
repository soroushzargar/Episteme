# Episteme Backend

Backend API for the Curiosity-to-Research Studio described in `description.md`.

The service is intentionally small and local-first:

- FastAPI HTTP surface for the frontend.
- SQLite persistence for projects, semantic blocks, graph edges, references, and export history.
- Markdown and JSON export helpers.
- Dependency-light core so persistence and export logic can be tested without running the API server.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e ".[dev]"
```

## Run

```bash
uvicorn backend.app.main:app --reload
```

By default the database is written to `data/episteme.sqlite3`.

Configuration is environment-driven:

```bash
EPISTEME_DB_PATH=data/episteme.sqlite3
EPISTEME_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## API Shape

- `GET /health`
- `GET /projects`
- `POST /projects`
- `GET /projects/{project_id}`
- `PATCH /projects/{project_id}`
- `DELETE /projects/{project_id}`
- `GET /projects/{project_id}/blocks`
- `POST /projects/{project_id}/blocks`
- `PATCH /blocks/{block_id}`
- `DELETE /blocks/{block_id}`
- `GET /projects/{project_id}/edges`
- `POST /projects/{project_id}/edges`
- `DELETE /edges/{edge_id}`
- `GET /projects/{project_id}/references`
- `POST /projects/{project_id}/references`
- `PATCH /references/{reference_id}`
- `DELETE /references/{reference_id}`
- `GET /projects/{project_id}/graph`
- `GET /projects/{project_id}/draft`
- `PUT /projects/{project_id}/draft`
- `GET /projects/{project_id}/evidence?checked=false&limit=50&offset=0`
- `PATCH /evidence/{block_id}`
- `GET /projects/{project_id}/draft/evidence-links`
- `POST /projects/{project_id}/draft/evidence-links`
- `DELETE /draft/evidence-links/{link_id}`
- `POST /projects/{project_id}/exports`
- `GET /projects/{project_id}/exports`

The drafting API stores the article as one saved editor document while
preserving evidence traceability. The frontend can save editor content through
`PUT /projects/{project_id}/draft`, create evidence blocks normally with
`POST /projects/{project_id}/blocks`, prioritize/check evidence through
`PATCH /evidence/{block_id}`, and link selected article text to an evidence
block through `POST /projects/{project_id}/draft/evidence-links`.

Creating a draft evidence link automatically marks that evidence as checked.
Deleting the last link to an evidence block marks it unchecked again.

## Test

```bash
pytest
```

## Frontend

```bash
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:5173` and uses
`http://127.0.0.1:8000` as the default backend API. If the backend is not
available, the app falls back to browser local storage so the design remains
usable while iterating.

## Native Apps

macOS desktop wrapper:

```bash
npm run desktop:dev
npm run desktop:dir
```

The verified unpacked app is produced at `release/mac-arm64/Episteme.app`.

iPadOS app:

```bash
npm run ios:init
npm run ios:sync
npm run ios:open
```

Open the generated Xcode workspace, choose your iPad as the run destination,
then press Run to install it on the device.

If you want the app on a physical iPad, you need:

1. A Mac with Xcode installed.
2. A USB cable or wireless debugging enabled for your iPad.
3. An Apple ID signed into Xcode for code signing.

For the first run, connect the iPad, trust the Mac on the device, open Xcode,
and select the iPad as the run target. After that, `npm run ios:sync` keeps the
native project in sync with web changes.

The shared CloudKit record contract lives in `src/sync/cloudkitRecords.js`.
That file defines the shape for a future sync layer, but the app is not yet
writing live project data to CloudKit. Today, the macOS Electron app uses the
local backend/SQLite path and the iPadOS app uses the Capacitor web shell with
local persistence fallback, so the two installs do not automatically share
saved results through iCloud yet.
