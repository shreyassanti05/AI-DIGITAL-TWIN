"""
AI Surveillance Platform - Configuration Settings
"""
from functools import lru_cache
from typing import List, Optional
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "AI Surveillance Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    ENVIRONMENT: str = Field(default="production", env="ENVIRONMENT")
    
    # Backend
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    
    # Security
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
    ]
    
    # AI/ML Models
    MODEL_PATH: str = "./models"
    DEFAULT_CONFIDENCE: float = 0.5
    DEFAULT_IOU: float = 0.45
    
    # YOLO Settings
    YOLO_MODEL_PATH: str = "./models/human/yolov8n.pt"
    YOLO_DEVICE: str = "auto"  # auto, cpu, cuda, mps
    YOLO_HALF: bool = False
    YOLO_IMG_SIZE: int = 640
    
    # Video Processing
    MAX_FPS: int = 30
    FRAME_SKIP: int = 2
    BATCH_SIZE: int = 1
    VIDEO_CODEC: str = "mp4v"
    
    # WebSocket
    WS_PING_INTERVAL: int = 20
    WS_PING_TIMEOUT: int = 20
    
    # Alert Settings
    ALERT_COOLDOWN_SECONDS: int = 60
    ALERT_WEBHOOK_URL: Optional[str] = None
    
    # Email Notifications
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    
    # Telegram Notifications
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None
    
    # Twilio SMS
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    
    # Storage
    UPLOAD_DIR: str = "./uploads"
    PROCESSED_DIR: str = "./processed"
    SNAPSHOT_DIR: str = "./snapshots"
    
    # GPU Settings
    CUDA_VISIBLE_DEVICES: str = "0"
    USE_TENSORRT: bool = False
    TENSORRT_ENGINE_PATH: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
