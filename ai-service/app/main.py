"""
main.py
───────
FastAPI application entry point.

Startup order:
  1. Load sentence-transformer model into memory (slow, ~5 s on CPU)
  2. Open asyncpg connection pool to Postgres
  3. Mount all routers

This order ensures the /health endpoint works even if the DB is slow to
come up, and that the embedding model is warm before the first request.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.embedder import load_model
from app.database import connect, disconnect

# ── Routers ──────────────────────────────────────────────────────────────────
from app.routers import embed, search, recommend, match, personalised_search


# ── Lifespan: startup + shutdown logic ───────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI's modern replacement for @app.on_event("startup/shutdown").
    Code before `yield` runs at startup; code after runs at shutdown.
    """
    # STARTUP ────────────────────────────────────────────────────────────────
    settings = get_settings()

    print("[startup] Loading embedding model …")
    load_model()                   # blocks until the model is in memory

    print("[startup] Connecting to database …")
    await connect()                # opens asyncpg pool, registers vector codec

    print(f"[startup] AI service ready on {settings.HOST}:{settings.PORT}")
    yield

    # SHUTDOWN ───────────────────────────────────────────────────────────────
    print("[shutdown] Closing database pool …")
    await disconnect()


# ── Application factory ───────────────────────────────────────────────────────

settings = get_settings()

app = FastAPI(
    title="XploreTN AI Service",
    description=(
        "Embedding pipeline, semantic search, recommendation engine, "
        "and social matching for the tourism platform."
    ),
    version="1.0.0",
    docs_url="/docs",       # Swagger UI  — disable in production if desired
    redoc_url="/redoc",     # ReDoc UI
    lifespan=lifespan,
)


# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow only the Node.js backend origin.
# For local dev, also allow the React dev server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # React dev server
        "http://localhost:5000",   # Node.js Express (adjust if different)
        # In production, replace with your actual domain(s)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(embed.router)
app.include_router(search.router)
app.include_router(recommend.router)
app.include_router(match.router)
app.include_router(personalised_search.router)


# ── Health check (no auth required) ──────────────────────────────────────────

@app.get("/health", tags=["Health"], include_in_schema=False)
async def health():
    """
    Used by Docker healthcheck and the Node.js backend's startup probe.
    Returns 200 only when the model and DB pool are both ready.
    """
    from app.embedder import get_model
    from app.database import get_pool
    return {
        "status":       "ok",
        "model":        settings.EMBEDDING_MODEL,
        "embedding_dim": settings.EMBEDDING_DIM,
    }