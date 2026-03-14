# ---- Backend Dockerfile ----
# FastAPI + Uvicorn on Python 3.11 slim

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install OS-level dependencies (needed for some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source
COPY . .

# Expose the port Uvicorn listens on
EXPOSE 8001

# Run with Uvicorn
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
