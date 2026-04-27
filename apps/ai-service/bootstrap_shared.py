from __future__ import annotations

import sys
from pathlib import Path


def _ensure_backend_shared_on_path() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    shared_python = repo_root / "packages" / "backend-shared" / "python"
    if shared_python.exists():
        sys.path.insert(0, str(shared_python))


_ensure_backend_shared_on_path()

