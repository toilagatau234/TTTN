"""
app/main.py — Rosee AI Service entry point.

Handles:
  - FastAPI app creation
  - CORS middleware (for Node.js backend)
  - Root health-check endpoint
  - Router inclusion
  - Structured logging setup
"""
import logging
import logging.config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.ml_models import lifespan
from app.routes import hydrangea
from app.config import HOST, PORT, ALLOWED_ORIGINS, DEBUG_MODE

# ── Logging configuration ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if DEBUG_MODE else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("rosee.main")

# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Rosee AI Engine",
    version="5.0.0",
    description=(
        "PhoBERT-powered NLP microservice for Rosee flower e-commerce.\n\n"
        "**Models:**\n"
        "- 🌿 **Hydrangea** — Named Entity Recognition (FLOWER, COLOR, OCCASION, PRICE, STYLE)"
    ),
    lifespan=lifespan,
)

# ── CORS (allow Node.js backend calls) ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(hydrangea.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    """Quick liveness probe for load balancers / Docker health checks."""
    from app.models.ml_models import ml_models
    return {
        "status": "ok",
        "version": "5.0.0",
        "models": {
            "intent": ml_models.get("intent") is not None,
            "ner": ml_models.get("ner_available", False),
        },
    }


@app.get("/", tags=["System"])
async def root():
    return {"message": "Rosee AI Engine v5.0.0 — see /docs for API reference"}


# ── Dev runner ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)