"""
Application settings and configuration
"""

import os
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "AI Surveillance Platform"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # Backend
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    
    
    # AI/ML
    MODELS_PATH: str = "./ai-models/weights"
    YOLO_MODEL_PATH: str = "./ai-models/weights/yolov11n.pt"
    USE_GPU: bool = True
    CUDA_VISIBLE_DEVICES: str = "0"
    AI_CONFIDENCE_THRESHOLD: float = 0.5
    AI_NMS_THRESHOLD: float = 0.45
    
    # Video Processing
    VIDEO_PROCESSING_FPS: int = 30
    MAX_CONCURRENT_STREAMS: int = 10
    
    # Alerts (optional - only if you want external notifications)
    ALERT_COOLDOWN_SECONDS: int = 60
    
    # Storage
    UPLOAD_PATH: str = "./data/uploads"
    EXPORT_PATH: str = "./data/exports"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
    


# Global settings instance
settings = Settings()
