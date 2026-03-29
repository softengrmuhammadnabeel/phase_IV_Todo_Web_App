from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = ""
    BETTER_AUTH_SECRET: str = "your-secret-key"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = ""
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True
    LOG_LEVEL: str = "INFO"

    OPENAI_API_KEY: Optional[str] = None

    def get_openai_api_key_clean(self) -> Optional[str]:
        """Return OPENAI_API_KEY with surrounding whitespace stripped (avoids 401 from copy-paste)."""
        key = self.OPENAI_API_KEY
        return key.strip() if key else None

    DEBUG: bool = False
    TESTING: bool = False

    class Config:
        env_file = ".env"

settings = Settings()
