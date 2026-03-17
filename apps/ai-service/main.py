from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(title="SuperBoard AI Service")


@app.get("/health")
def health() -> dict:
    return {
        "success": True,
        "data": {
            "status": "ok",
            "dependencies": {},
        },
        "meta": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    }
