"""
AI Surveillance Platform - Main Application
FastAPI backend with real-time video processing and threat detection.
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    logger.info("=" * 60)
    logger.info("🚀 AI Surveillance Platform Starting...")
    logger.info("=" * 60)

    # Ensure required directories exist
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("models", exist_ok=True)
    os.makedirs("snapshots", exist_ok=True)

    # Pre-initialize AI pipeline (download model on first run)
    try:
        from app.ai.pipeline import ai_pipeline
        ai_pipeline.initialize()
        logger.info("✅ AI Pipeline initialized")
    except Exception as e:
        logger.warning(f"⚠️ AI Pipeline init deferred: {e}")

    logger.info("✅ Server ready at http://localhost:8000")
    logger.info("📖 API Docs at http://localhost:8000/docs")

    yield

    # Shutdown
    logger.info("🛑 Shutting down...")
    try:
        from app.video.stream_processor import StreamManager
        # Stop all streams on shutdown
    except Exception:
        pass
    logger.info("👋 Goodbye!")


# Create FastAPI app
app = FastAPI(
    title="AI Surveillance Platform",
    description="AI-powered real-time surveillance system with threat detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_router, prefix="/api/v1")


# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "ok",
        "service": "ai-surveillance-platform",
        "version": "1.0.0",
    }


@app.get("/api/health")
async def api_health_check():
    """API health check with system info"""
    import platform

    gpu_available = False
    try:
        import torch
        gpu_available = torch.cuda.is_available()
    except ImportError:
        pass

    return {
        "status": "ok",
        "service": "ai-surveillance-platform",
        "version": "1.0.0",
        "system": {
            "python": platform.python_version(),
            "os": platform.system(),
            "gpu_available": gpu_available,
        },
    }
