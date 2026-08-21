"""
API v1 Router
Registers all endpoint groups
"""
from fastapi import APIRouter
from app.api.v1.endpoints import streams, models

api_router = APIRouter()

# Stream endpoints (webcam, rtsp, file, websocket)
api_router.include_router(streams.router, prefix="/streams", tags=["streams"])

# Model management endpoints
api_router.include_router(models.router, prefix="/models", tags=["models"])
