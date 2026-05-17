from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    db_path: Path
    cors_origins: tuple[str, ...]


def load_settings() -> Settings:
    db_path = Path(os.getenv("EPISTEME_DB_PATH", "data/episteme.sqlite3"))
    origins = os.getenv(
        "EPISTEME_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
    )
    parsed_origins = tuple(origin.strip() for origin in origins.split(",") if origin.strip())
    return Settings(db_path=db_path, cors_origins=parsed_origins)
