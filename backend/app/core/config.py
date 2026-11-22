import os
from pydantic_settings import BaseSettings
from typing import List, Union
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "FinPilot AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "finpilot-super-secret-jwt-key-2026-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./finpilot.db")
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()
