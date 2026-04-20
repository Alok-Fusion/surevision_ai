from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_api_version: str = "v1beta"

    # OpenRouter settings
    openrouter_api_key: str | None = None
    openrouter_model: str = "anthropic/claude-sonnet-4"
    ai_provider: str = "openrouter"  # "gemini" or "openrouter"

    port: int = 8000
    request_timeout_seconds: int = 120

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
