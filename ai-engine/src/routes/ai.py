from fastapi import APIRouter, Header, HTTPException

from src.engines.provider import get_provider
from src.schemas.analysis import AnalyzeRequest, InsightsRequest, WhatIfRequest
from src.utils.friction import detect_workflow_friction

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze")
def analyze(request: AnalyzeRequest, x_surevision_gemini_key: str | None = Header(default=None)):
    try:
        provider = get_provider(x_surevision_gemini_key)
        return provider.analyze(request.decision, request.historicalDecisionCount)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/whatif")
def what_if(request: WhatIfRequest, x_surevision_gemini_key: str | None = Header(default=None)):
    try:
        provider = get_provider(x_surevision_gemini_key)
        return provider.what_if(request)
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/insights")
def insights(request: InsightsRequest):
    return detect_workflow_friction(request.records, request.csvText)
