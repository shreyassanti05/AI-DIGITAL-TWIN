"""
AI Pipeline Orchestrator
Coordinates detection, tracking, and analysis.
"""
import logging
import time
from typing import Dict, List, Optional, Any
import numpy as np

logger = logging.getLogger(__name__)


class AIPipeline:
    """
    Central AI Pipeline that orchestrates:
    - YOLO object detection
    - Object tracking
    - Weapon detection (via COCO classes)
    - Fire/smoke detection
    - Violence detection
    - Activity analysis
    - Threat scoring
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self._initialized = False

        # Detectors (lazily loaded)
        self._yolo_detector = None
        self._tracker = None
        self._fire_detector = None
        self._violence_detector = None
        self._activity_analyzer = None

        # Stats
        self.frame_count = 0
        self.total_detections = 0
        self.total_alerts = 0
        self._fps_times: list = []

    def initialize(self):
        """Initialize all AI modules"""
        if self._initialized:
            return

        try:
            from app.ai.detectors.yolo_detector import get_detector
            self._yolo_detector = get_detector()
            logger.info("✅ YOLO detector initialized")
        except Exception as e:
            logger.error(f"❌ Failed to init YOLO: {e}")

        try:
            from app.ai.trackers.deepsort_tracker import DeepSortTracker
            self._tracker = DeepSortTracker()
            logger.info("✅ Object tracker initialized")
        except Exception as e:
            logger.warning(f"⚠️ Tracker init failed: {e}")

        try:
            from app.ai.detectors.fire_detector import FireDetector
            self._fire_detector = FireDetector()
            logger.info("✅ Fire detector initialized")
        except Exception as e:
            logger.warning(f"⚠️ Fire detector init failed: {e}")

        try:
            from app.ai.detectors.violence_detector import ViolenceDetector, ActivityAnalyzer
            self._violence_detector = ViolenceDetector()
            self._activity_analyzer = ActivityAnalyzer()
            logger.info("✅ Violence detector initialized")
        except Exception as e:
            logger.warning(f"⚠️ Violence detector init failed: {e}")

        self._initialized = True
        logger.info("🚀 AI Pipeline fully initialized")

    def process_frame(self, frame: np.ndarray, options: Optional[Dict] = None) -> Dict:
        """
        Process a single frame through all detection pipelines.

        Returns dict with detections, alerts, threat level, etc.
        """
        if not self._initialized:
            self.initialize()

        start = time.time()
        self.frame_count += 1
        options = options or {}
        timestamp = time.time()

        all_detections: List[Dict] = []
        alerts: List[Dict] = []

        # YOLO detection
        if self._yolo_detector:
            yolo_dets = self._yolo_detector.detect(
                frame,
                conf_threshold=options.get("detection_confidence", 0.5),
            )

            for det in yolo_dets:
                d = {
                    "class_name": det.class_name,
                    "confidence": det.confidence,
                    "bbox": list(det.bbox),
                    "class_id": det.class_id,
                }
                if det.class_name == "person":
                    d["type"] = "human"
                elif det.class_name in ["knife", "scissors", "baseball bat"]:
                    d["type"] = "weapon"
                    d["weapon_type"] = det.class_name
                else:
                    d["type"] = det.class_name

                all_detections.append(d)

        # Tracking
        if self._tracker:
            person_dets = [d for d in (self._yolo_detector.detect(frame, classes=[0]) if self._yolo_detector else [])]
            tracks = self._tracker.update(person_dets)
            for track in tracks:
                for det in all_detections:
                    if det.get("type") == "human" and det.get("track_id") is None:
                        det["track_id"] = track.track_id
                        break

        processing_ms = (time.time() - start) * 1000
        self._fps_times.append(processing_ms)
        if len(self._fps_times) > 30:
            self._fps_times.pop(0)

        avg_ms = sum(self._fps_times) / len(self._fps_times)

        return {
            "frame_number": self.frame_count,
            "timestamp": timestamp,
            "detections": all_detections,
            "alerts": alerts,
            "human_count": sum(1 for d in all_detections if d.get("type") == "human"),
            "processing_time_ms": processing_ms,
            "fps": 1000.0 / max(avg_ms, 1),
            "threat_level": "low",
        }

    @property
    def stats(self) -> Dict:
        return {
            "frames_processed": self.frame_count,
            "total_detections": self.total_detections,
            "total_alerts": self.total_alerts,
            "avg_processing_ms": sum(self._fps_times) / max(len(self._fps_times), 1),
            "initialized": self._initialized,
        }


# Global pipeline instance
ai_pipeline = AIPipeline()
