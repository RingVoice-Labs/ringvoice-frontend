import os
from typing import List

class Settings:
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # SQLite file path in the backend folder by default
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'ringvoice.db')}")
    
    # Authentication token matching frontend contract
    AUTH_TOKEN: str = os.getenv("AUTH_TOKEN", "mock-token")
    
    # Ring Doorbell webhook signature secret (optional in dev)
    RING_WEBHOOK_SECRET: str = os.getenv("RING_WEBHOOK_SECRET", "")
    
    # Speech-to-Text provider ("local_simulation", "whisper", "deepgram")
    STT_PROVIDER: str = os.getenv("STT_PROVIDER", "local_simulation")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEEPGRAM_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")

    # CORS configuration
    CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
