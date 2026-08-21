"""
WebSocket Manager
Handles real-time communication between backend and frontend.
Uses FastAPI native WebSocket (not socket.io).
"""
import asyncio
import base64
import json
import logging
import time
from typing import Dict, List, Set, Optional, Any

import cv2
import numpy as np
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections per stream"""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, stream_id: str):
        await websocket.accept()
        if stream_id not in self.active_connections:
            self.active_connections[stream_id] = set()
        self.active_connections[stream_id].add(websocket)
        logger.info(f"WebSocket connected: {stream_id} (viewers: {len(self.active_connections[stream_id])})")

    def disconnect(self, websocket: WebSocket):
        for stream_id, connections in self.active_connections.items():
            connections.discard(websocket)
        logger.info("WebSocket disconnected")

    def get_stream_viewers(self, stream_id: str) -> int:
        return len(self.active_connections.get(stream_id, set()))

    async def broadcast_to_stream(self, stream_id: str, message: dict):
        """Send message to all viewers of a stream"""
        connections = self.active_connections.get(stream_id, set())
        dead = set()

        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.add(ws)

        for ws in dead:
            connections.discard(ws)


class WebSocketStreamer:
    """Streams processed frames and alerts via WebSocket"""

    def __init__(self, connection_manager: ConnectionManager):
        self.manager = connection_manager
        self.jpeg_quality = 70
        self.max_frame_width = 640

    async def send_frame(self, stream_id: str, frame: np.ndarray, result: Dict):
        """
        Encode frame to JPEG, send via WebSocket along with detection data.
        """
        viewers = self.manager.get_stream_viewers(stream_id)
        if viewers == 0:
            return

        try:
            # Resize frame for transmission efficiency
            h, w = frame.shape[:2]
            if w > self.max_frame_width:
                scale = self.max_frame_width / w
                frame = cv2.resize(frame, None, fx=scale, fy=scale)

            # Encode to JPEG
            encode_params = [cv2.IMWRITE_JPEG_QUALITY, self.jpeg_quality]
            _, buffer = cv2.imencode('.jpg', frame, encode_params)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            # Build message
            message = {
                "type": "frame",
                "stream_id": stream_id,
                "frame": frame_base64,
                "timestamp": time.time(),
                "detections": result.get("detections", []),
                "threat_level": result.get("threat_assessment", {}).get("overall_level", "low"),
                "fps": result.get("fps", 0),
                "alert_count": len(result.get("alerts", [])),
                "stats": {
                    "human_count": result.get("human_count", 0),
                    "processing_ms": result.get("processing_time_ms", 0),
                },
            }

            await self.manager.broadcast_to_stream(stream_id, message)

            # Send alerts separately
            for alert in result.get("alerts", []):
                alert_msg = {
                    "type": "alert",
                    "stream_id": stream_id,
                    "alert": alert,
                    "timestamp": time.time(),
                }
                await self.manager.broadcast_to_stream(stream_id, alert_msg)

            # Send detection update
            if result.get("detections"):
                det_msg = {
                    "type": "detection_update",
                    "stream_id": stream_id,
                    "detections": result.get("detections", []),
                    "stats": message["stats"],
                    "timestamp": time.time(),
                }
                await self.manager.broadcast_to_stream(stream_id, det_msg)

        except Exception as e:
            logger.error(f"Error sending frame to {stream_id}: {e}")

    async def send_stream_status(self, stream_id: str, status: str, data: Optional[Dict] = None):
        """Send stream status update"""
        message = {
            "type": "status",
            "stream_id": stream_id,
            "status": status,
            **(data or {}),
        }
        await self.manager.broadcast_to_stream(stream_id, message)


# Global instances
connection_manager = ConnectionManager()
ws_streamer = WebSocketStreamer(connection_manager)
