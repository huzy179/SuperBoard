import os
from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(title="SuperBoard AI Service")

# Ensure telemetry data directory exists
os.makedirs("data", exist_ok=True)

@app.get("/health")
def health() -> dict:
    provider = os.getenv("AI_PROVIDER", "gemini")
    return {
        "success": True,
        "data": {
            "status": "ok",
            "provider": provider,
            "dependencies": {},
        },
        "meta": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    }
