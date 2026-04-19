# ── Build stage ───────────────────────────────────────────────────────────────
# We separate dependency install from the app copy so Docker cache is reused
# when only source code changes (dependencies stay cached unless requirements.txt changes).
FROM python:3.11-slim AS base

WORKDIR /app

# System deps required to build some Python wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies FIRST (layer cache optimisation)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Pre-download the model ────────────────────────────────────────────────────
# Bake the model weights into the image so the container starts in ~1 s instead
# of downloading ~500 MB at every cold start. Requires EMBEDDING_MODEL build arg.
ARG EMBEDDING_MODEL=intfloat/e5-base-v2
RUN python -c "from sentence_transformers import SentenceTransformer; \
               SentenceTransformer('${EMBEDDING_MODEL}')"

# ── Application ───────────────────────────────────────────────────────────────
COPY app/ ./app/

# Non-root user — security best practice
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

# Uvicorn flags:
#   --workers 1      keep to 1 for CPU; the model is already in RAM
#   --loop uvloop    faster event loop (installed by uvicorn[standard])
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1 --loop uvloop"]