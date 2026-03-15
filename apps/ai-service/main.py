from fastapi import FastAPI

app = FastAPI(title="SuperBoard AI Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
