from __future__ import annotations

import sys
from pathlib import Path


def _ensure_backend_shared_on_path() -> None:
    # Local development (monorepo structure)
    try:
        repo_root = Path(__file__).resolve().parents[2]
        shared_python = repo_root / "packages" / "backend-shared" / "python"
        if shared_python.exists():
            sys.path.insert(0, str(shared_python))
            return
    except (IndexError, ValueError):
        pass

    # Docker environment (absolute path)
    docker_shared = Path("/packages/backend-shared/python")
    if docker_shared.exists():
        sys.path.insert(0, str(docker_shared))


_ensure_backend_shared_on_path()

