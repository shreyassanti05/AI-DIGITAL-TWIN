"""
Violence Detection Module
Uses temporal motion analysis as primary method.
Falls back gracefully when no custom model is available.
"""
import logging
import time
from collections import deque
from typing import List, Dict, Optional
import numpy as np
import cv2

logger = logging.getLogger(__name__)


class ViolenceDetector:
    """
    Violence detection using temporal motion analysis.
    Uses frame difference and optical flow to detect sudden violent motion.
    """

    def __init__(self, sequence_length: int = 16, confidence_threshold: float = 0.7):
        self.sequence_length = sequence_length
        self.confidence_threshold = confidence_threshold
        self.frame_buffer: deque = deque(maxlen=sequence_length)
        self.motion_scores: deque = deque(maxlen=30)

    def analyze_frame(self, frame: np.ndarray) -> Dict:
        """Analyze single frame in temporal context for violence"""
        processed = cv2.resize(frame, (224, 224))
        processed = processed.astype(np.float32) / 255.0
        self.frame_buffer.append(processed)

        if len(self.frame_buffer) < 2:
            return {
                "violence_detected": False,
                "confidence": 0.0,
                "action": None,
                "buffer_fill": len(self.frame_buffer) / self.sequence_length,
                "requires_alert": False,
            }

        return self._motion_analysis()

    def _motion_analysis(self) -> Dict:
        """Detect violence via motion intensity analysis"""
        prev = self.frame_buffer[-2]
        curr = self.frame_buffer[-1]

        diff = np.abs(curr - prev)
        motion_score = float(np.mean(diff))
        self.motion_scores.append(motion_score)

        # Violence needs sustained high motion
        is_violent = False
        confidence = 0.0

        if len(self.motion_scores) >= 5:
            recent_avg = np.mean(list(self.motion_scores)[-5:])
            if recent_avg > 0.12:
                is_violent = True
                confidence = min(recent_avg * 4, 0.95)

        return {
            "violence_detected": is_violent,
            "confidence": confidence,
            "motion_score": motion_score,
            "method": "motion_analysis",
            "action": "violence" if is_violent else "normal",
            "requires_alert": is_violent and confidence > self.confidence_threshold,
        }

    def reset_buffer(self):
        self.frame_buffer.clear()
        self.motion_scores.clear()


class ActivityAnalyzer:
    """Analyze human activities for suspicious behavior"""

    def __init__(self):
        self.person_positions: Dict = {}
        self.loitering_threshold = 10
        self.running_threshold = 2.0

    def analyze_activity(self, detections: List[Dict], frame_time: float) -> List[Dict]:
        alerts = []

        for det in detections:
            track_id = det.get("track_id")
            if track_id is None:
                continue

            bbox = det.get("bbox")
            if bbox is None:
                continue

            x1, y1, x2, y2 = bbox
            center = ((x1 + x2) / 2, (y1 + y2) / 2)

            if track_id not in self.person_positions:
                self.person_positions[track_id] = []

            self.person_positions[track_id].append({
                "time": frame_time,
                "position": center,
            })

            cutoff_time = frame_time - 30
            self.person_positions[track_id] = [
                p for p in self.person_positions[track_id] if p["time"] > cutoff_time
            ]

            activity = self._classify_activity(track_id)
            if activity["type"] != "normal":
                alerts.append({
                    "track_id": track_id,
                    "activity": activity["type"],
                    "confidence": activity["confidence"],
                    "description": activity["description"],
                })

        return alerts

    def _classify_activity(self, track_id: int) -> Dict:
        positions = self.person_positions.get(track_id, [])

        if len(positions) < 5:
            return {"type": "normal", "confidence": 1.0, "description": "Insufficient data"}

        total_distance = 0
        max_speed = 0

        for i in range(1, len(positions)):
            prev = positions[i - 1]
            curr = positions[i]

            dx = curr["position"][0] - prev["position"][0]
            dy = curr["position"][1] - prev["position"][1]
            distance = np.sqrt(dx ** 2 + dy ** 2)

            dt = curr["time"] - prev["time"]
            if dt > 0:
                speed = distance / dt
                max_speed = max(max_speed, speed)
                total_distance += distance

        time_span = positions[-1]["time"] - positions[0]["time"]

        if time_span > self.loitering_threshold and total_distance < 50:
            return {
                "type": "loitering",
                "confidence": min(time_span / self.loitering_threshold, 1.0),
                "description": f"Person stationary for {time_span:.1f}s",
            }

        if max_speed > self.running_threshold * 50:
            return {
                "type": "running",
                "confidence": min(max_speed / (self.running_threshold * 100), 1.0),
                "description": "Fast movement detected",
            }

        return {"type": "normal", "confidence": 1.0, "description": "Normal movement"}
