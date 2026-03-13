# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install --no-cache-dir poetry==2.1.1

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies into a virtualenv
RUN poetry config virtualenvs.in-project true && \
    poetry install --no-root --without dev && \
    rm -rf /root/.cache

# Stage 2: Final
FROM python:3.11-slim

WORKDIR /app

# Copy virtualenv and application code
COPY --from=builder /app/.venv /app/.venv
COPY . .

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Expose port (relevant for backend only, but safe for all)
EXPOSE 8000

# Default command (overridden in docker-compose for worker/beat)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
