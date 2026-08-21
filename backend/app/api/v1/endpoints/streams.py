"""
Stream Management API Endpoints
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict
import asyncio
import json
import logging
import os
import time
import uuid
import tempfile
import shutil

from app.video.stream_processor import StreamManager, ProcessingConfig, StreamProcessor
from app.websocket.manager import connection_manager, ws_streamer
from app.alerts.engine import alert_engine

logger = logging.getLogger(__name__)
router = APIRouter()

# Global stream manager
stream_manager = StreamManager()

# Temp upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.api_route("/start", methods=["GET", "POST"])
async def start_stream(
    stream_id: str,
    source: str,
    source_type: str = "auto",
    enable_tracking: bool = True,
    enable_weapon_detection: bool = True,
    enable_fire_detection: bool = True,
    enable_violence_detection: bool = True,
    enable_fall_detection: bool = True,
    detection_confidence: float = 0.5,
    target_fps: float = 15.0
):
    """
    Start a new video stream for processing

    Args:
        stream_id: Unique identifier for the stream
        source: Video source (0 for webcam, rtsp://..., file path)
        source_type: Type of source (webcam, rtsp, file, auto)
    """
    # Create processing configuration
    config = ProcessingConfig(
        target_fps=target_fps,
        enable_tracking=enable_tracking,
        enable_weapon_detection=enable_weapon_detection,
        enable_fire_detection=enable_fire_detection,
        enable_violence_detection=enable_violence_detection,
        enable_fall_detection=enable_fall_detection,
        detection_confidence=detection_confidence
    )

    # Start stream
    success = await stream_manager.add_stream(stream_id, source, config)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to start stream")

    # Get processor and set up callbacks
    processor = stream_manager.get_stream(stream_id)

    async def on_frame(frame, result):
        """Handle processed frame"""
        # Draw overlays
        display_frame = processor.draw_overlays(frame, result)

        # Send via WebSocket
        await ws_streamer.send_frame(stream_id, display_frame, result)

        # Process detections for alerts
        for alert in result.get("alerts", []):
            try:
                await alert_engine.process_detection(stream_id, alert, frame)
            except Exception as e:
                logger.debug(f"Alert processing error: {e}")

    async def on_alert(alert, sid):
        """Handle alert"""
        logger.warning(f"Alert from {sid}: {alert}")

    processor.on_frame = on_frame
    processor.on_alert = on_alert

    return {
        "success": True,
        "stream_id": stream_id,
        "message": "Stream started successfully",
        "config": {
            "source": source,
            "source_type": source_type,
            "target_fps": target_fps,
            "detection_confidence": detection_confidence
        }
    }


@router.api_route("/stop/{stream_id}", methods=["GET", "POST"])
async def stop_stream(stream_id: str):
    """Stop a running stream"""
    stream_manager.remove_stream(stream_id)

    return {
        "success": True,
        "stream_id": stream_id,
        "message": "Stream stopped"
    }


@router.get("/list")
async def list_streams() -> List[Dict]:
    """List all active streams"""
    return stream_manager.list_streams()


@router.get("/status/{stream_id}")
async def get_stream_status(stream_id: str):
    """Get detailed status of a stream"""
    processor = stream_manager.get_stream(stream_id)

    if not processor:
        raise HTTPException(status_code=404, detail="Stream not found")

    info = processor.info

    return {
        "stream_id": stream_id,
        "source": info.source,
        "source_url": info.source_url,
        "resolution": f"{info.width}x{info.height}",
        "fps": info.fps,
        "frame_count": info.frame_count,
        "is_active": info.is_active,
        "runtime_seconds": time.time() - info.start_time,
        "error_count": info.error_count,
        "viewers": connection_manager.get_stream_viewers(stream_id)
    }


@router.websocket("/ws/{stream_id}")
async def stream_websocket(websocket: WebSocket, stream_id: str):
    """
    WebSocket endpoint for real-time stream viewing

    Clients connect here to receive live video frames and detection data
    """
    await connection_manager.connect(websocket, stream_id)

    try:
        # Send initial status
        await ws_streamer.send_stream_status(stream_id, "connected", {
            "stream_id": stream_id,
            "timestamp": time.time()
        })

        while True:
            # Keep connection alive and handle client messages
            data = await websocket.receive_text()

            try:
                message = json.loads(data)

                # Handle client commands
                if message.get("action") == "ping":
                    await websocket.send_json({"type": "pong"})

                elif message.get("action") == "get_status":
                    processor = stream_manager.get_stream(stream_id)
                    if processor:
                        await websocket.send_json({
                            "type": "status",
                            "frame_count": processor.frame_count,
                            "is_active": processor.is_running
                        })

            except json.JSONDecodeError as e:
                logger.error(f"WebSocket JSON parse error: {e}")
            except Exception as e:
                logger.error(f"WebSocket message error: {e}")

    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
        logger.info(f"WebSocket client disconnected from {stream_id}")
    except Exception as e:
        connection_manager.disconnect(websocket)
        logger.error(f"WebSocket error for {stream_id}: {e}")


@router.post("/upload-video")
async def upload_video_file(
    file: UploadFile = File(...),
    stream_id: Optional[str] = Form(None),
    enable_weapon_detection: bool = Form(True),
    enable_fire_detection: bool = Form(True),
    enable_violence_detection: bool = Form(False),
    enable_fall_detection: bool = Form(False),
):
    """
    Upload and process a video file.
    Accepts actual file upload via multipart/form-data.
    """
    if stream_id is None:
        stream_id = f"video_{uuid.uuid4().hex[:8]}"

    # Save uploaded file
    file_ext = os.path.splitext(file.filename or "video.mp4")[1]
    save_path = os.path.join(UPLOAD_DIR, f"{stream_id}{file_ext}")

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    config = ProcessingConfig(
        target_fps=30.0,
        frame_skip=0,
        enable_weapon_detection=enable_weapon_detection,
        enable_fire_detection=enable_fire_detection,
        enable_violence_detection=enable_violence_detection,
        enable_fall_detection=enable_fall_detection,
    )

    success = await stream_manager.add_stream(stream_id, save_path, config)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to start video processing")

    # Set up callbacks
    processor = stream_manager.get_stream(stream_id)
    if processor:
        async def on_frame(frame, result):
            display_frame = processor.draw_overlays(frame, result)
            await ws_streamer.send_frame(stream_id, display_frame, result)

        processor.on_frame = on_frame

    return {
        "success": True,
        "stream_id": stream_id,
        "message": "Video upload processing started",
        "file_path": save_path,
    }


@router.post("/upload-video-path")
async def upload_video_path(
    stream_id: str,
    file_path: str,
    process_async: bool = True
):
    """
    Process a video file from a filesystem path.
    """
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail=f"File not found: {file_path}")

    config = ProcessingConfig(
        target_fps=30.0,
        frame_skip=0,
    )

    success = await stream_manager.add_stream(stream_id, file_path, config)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to start video processing")

    return {
        "success": True,
        "stream_id": stream_id,
        "message": "Video processing started",
        "file_path": file_path,
    }


@router.post("/configure/{stream_id}")
async def configure_stream(
    stream_id: str,
    enable_weapon_detection: Optional[bool] = None,
    enable_fire_detection: Optional[bool] = None,
    enable_violence_detection: Optional[bool] = None,
    enable_fall_detection: Optional[bool] = None,
    detection_confidence: Optional[float] = None,
    target_fps: Optional[float] = None
):
    """Update stream processing configuration"""
    processor = stream_manager.get_stream(stream_id)

    if not processor:
        raise HTTPException(status_code=404, detail="Stream not found")

    # Update config
    if enable_weapon_detection is not None:
        processor.config.enable_weapon_detection = enable_weapon_detection
    if enable_fire_detection is not None:
        processor.config.enable_fire_detection = enable_fire_detection
    if enable_violence_detection is not None:
        processor.config.enable_violence_detection = enable_violence_detection
    if enable_fall_detection is not None:
        processor.config.enable_fall_detection = enable_fall_detection
    if detection_confidence is not None:
        processor.config.detection_confidence = detection_confidence
    if target_fps is not None:
        processor.config.target_fps = target_fps

    return {
        "success": True,
        "stream_id": stream_id,
        "config": {
            "enable_weapon_detection": processor.config.enable_weapon_detection,
            "enable_fire_detection": processor.config.enable_fire_detection,
            "enable_violence_detection": processor.config.enable_violence_detection,
            "enable_fall_detection": processor.config.enable_fall_detection,
            "detection_confidence": processor.config.detection_confidence,
            "target_fps": processor.config.target_fps
        }
    }
