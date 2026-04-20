from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.routes.ai import router as ai_router

app = FastAPI(
    title="SureVision AI Engine",
    description="Enterprise risk, decision intelligence, and what-if simulation engine.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "service": "surevision-ai-engine",
        "status": "ok",
        "provider": "gemini",
        "defaultGeminiKeyConfigured": bool(settings.gemini_api_key),
    }


app.include_router(ai_router)
