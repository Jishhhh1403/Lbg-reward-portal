"""CEAEI Middleware.

A dedicated, standalone middleware for the "Set a Goal" / "Personalise my
LBG Coin" Objective Workspace wizard. It is intentionally separate from the
main ILRP agentic (SDUI) middleware: it hosts only the AI content-generation
endpoint used by the goal wizard and has no dependency on the SDUI
orchestration, database or blockchain pipelines.

Each wizard stage (summary, constraints, opportunities, strategies, evidence,
execution) is generated at runtime by an LLM. The frontend keeps the exact
12-screen wizard skeleton; this service only produces the per-stage content.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(str(Path(__file__).parent.parent / ".env"))

from schemas.objective import (
    ObjectiveGenerateRequest,
    ObjectiveGenerateResponse,
    ObjectiveScreenPayload,
)
from services.objective_service import ObjectiveService

objective_service: ObjectiveService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global objective_service
    gemini_count = sum(1 for i in range(1, 4) if os.getenv(f"GEMINI_API_KEY_{i}"))
    groq_configured = bool(os.getenv("GROQ_API_KEY"))
    print(f"[CEAEI STARTUP] Gemini keys: {gemini_count}, Groq: {groq_configured}")
    objective_service = ObjectiveService()
    yield


app = FastAPI(
    title="CEAEI Middleware",
    version="1.0.0",
    description="Standalone AI content middleware for the Goal / LBG Coin workspace",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/objective/generate")
async def generate_objective(request: ObjectiveGenerateRequest):
    if objective_service is None:
        return ObjectiveGenerateResponse(
            status="REJECTED",
            screen=ObjectiveScreenPayload(screenType=""),
            reasonCodes=["SERVICE_NOT_READY"],
            error="CEAEI middleware not initialized",
        ).model_dump()
    return await objective_service.generate(request)


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ceaei-middleware",
        "version": "1.0.0",
        "endpoints": ["/objective/generate"],
    }
