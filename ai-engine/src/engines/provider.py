from src.core.config import settings
from src.engines.gemini_provider import GeminiProvider
from src.engines.openrouter_provider import OpenRouterProvider


def get_provider(api_key: str | None = None):
    if settings.ai_provider == "openrouter":
        resolved_key = api_key or settings.openrouter_api_key
        if not resolved_key:
            raise ValueError("OpenRouter API key is not configured. Set OPENROUTER_API_KEY in .env or save a personal key in Settings.")
        return OpenRouterProvider(resolved_key)

    # Default: Gemini
    resolved_key = api_key or settings.gemini_api_key
    if not resolved_key:
        raise ValueError("Gemini API key is not configured. Set GEMINI_API_KEY in .env or save a personal key in Settings.")
    return GeminiProvider(resolved_key)
