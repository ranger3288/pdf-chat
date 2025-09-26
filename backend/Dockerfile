# Multi-stage not necessary here, but we keep layers tidy and cache-friendly
FROM python:3.11-slim


# Keep Python fast and logs unbuffered
ENV PYTHONDONTWRITEBYTECODE=1 \
PYTHONUNBUFFERED=1 \
PIP_NO_CACHE_DIR=1


WORKDIR /app


# System deps (minimal). build-essential helps if you later swap deps that need compiling.
RUN apt-get update && apt-get install -y --no-install-recommends \
build-essential \
libpq5 \
&& rm -rf /var/lib/apt/lists/*


# Install Python deps first (better layer caching)
COPY app/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt


# Copy application code
COPY app/ /app/app


# Non-root user for safety
RUN useradd -m appuser
USER appuser


EXPOSE 8000


CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]