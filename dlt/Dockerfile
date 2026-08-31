FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY dlt/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY dlt/ /app/dlt/
COPY dlt/contracts/ /app/contracts/
COPY dlt/scripts/ /app/scripts/
COPY dlt/deployed/ /app/deployed/

ENV PYTHONPATH=/app:/app/dlt
ENV PYTHONUNBUFFERED=1

CMD ["sh", "-c", "python /app/scripts/wait_for_besu.py && python /app/scripts/compile_contract.py && python /app/scripts/deploy_contract.py && uvicorn dlt.app.main:app --host 0.0.0.0 --port 8000"]
