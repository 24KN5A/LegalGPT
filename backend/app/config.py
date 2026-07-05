"""
Centralized application configuration.

All environment-dependent values (API keys, provider choice, storage paths,
model names, CORS origins, etc.) live here and NOWHERE else. Never hardcode
secrets or paths elsewhere in the codebase — import `settings` instead.
"""
from functools import lru_cache
from pathlib import Path
from typing import List, Literal, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- App metadata ---
    app_name: str = "LegalGPT API"
    app_version: str = "1.0.0"
    environment: Literal["development", "production", "test"] = "development"
    debug: bool = True

    # --- CORS ---
    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    # --- Storage paths ---
    upload_dir: Path = BASE_DIR / "uploads"
    chroma_persist_dir: Path = BASE_DIR / "storage" / "chroma"
    sqlite_path: Path = BASE_DIR / "storage" / "legalgpt.db"
    log_dir: Path = BASE_DIR / "logs"

    # --- Upload limits ---
    max_upload_size_mb: int = 25
    allowed_upload_extensions: List[str] = Field(default_factory=lambda: [".pdf"])

    # --- Chunking ---
    chunk_size: int = 1000
    chunk_overlap: int = 150

    # --- Embeddings (local, free, default) ---
    embedding_provider: Literal["local", "openai"] = "local"
    embedding_model_name: str = "all-MiniLM-L6-v2"
    openai_embedding_model: str = "text-embedding-3-small"

    # --- LLM provider abstraction ---
    # Supports "ollama" (local/free, default), "openai", and "anthropic".
    # Selecting openai/anthropic requires the matching API key below.
    llm_provider: Literal["ollama", "openai", "anthropic"] = "ollama"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"

    openai_api_key: Optional[str] = None
    openai_chat_model: str = "gpt-4o-mini"

    anthropic_api_key: Optional[str] = None
    anthropic_chat_model: str = "claude-sonnet-4-6"

    llm_temperature: float = 0.2
    llm_max_tokens: int = 1024

    # --- RAG ---
    retrieval_top_k: int = 5

    # --- Chroma collection ---
    chroma_collection_name: str = "legalgpt_documents"

    # --- Auth ---
    # IMPORTANT: override `secret_key` via a `.env` file (SECRET_KEY=...) in any
    # real deployment. This default is fine for local dev only.
    secret_key: str = "dev-only-insecure-secret-change-me-in-.env"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    def ensure_dirs(self) -> None:
        for d in (self.upload_dir, self.chroma_persist_dir, self.sqlite_path.parent, self.log_dir):
            d.mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.ensure_dirs()
    return settings


settings = get_settings()
