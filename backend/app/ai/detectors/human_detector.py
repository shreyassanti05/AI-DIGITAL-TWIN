"""
Human Detection Module
Uses the shared YOLO detector for person detection — no separate model needed.
"""
import time
import logging
from typing import List
import numpy as np

from app.ai.detectors.base_detector import BaseDetector, Detection, DetectionResult
from app.ai.detectors.yolo_detector import get_detector

logger = logging.getLogger(__name__)


class HumanDetector(BaseDetector):
    """
    Specialized detector for humans/persons.
    Wraps the main YOLO detector, filtering for person class only.
    """

    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(confidence_threshold=confidence_threshold)
        self._detector = None

    def _get_detector(self):
        if self._detector is None:
            self._detector = get_detector()
        return self._detector

    def detect(self, frame: np.ndarray) -> DetectionResult:
        """Detect humans in frame using COCO person class"""
        start = time.time()
        detector = self._get_detector()

        yolo_dets = detector.detect(frame, classes=[0], conf_threshold=self.confidence_threshold)

        detections = []
        for d in yolo_dets:
            det = Detection(
                class_id=d.class_id,
                class_name="person",
                confidence=d.confidence,
                bbox=d.bbox,
                track_id=d.track_id,
                metadata={
                    "detection_type": "human",
                    "crowd_risk": self._assess_crowd_risk(len(yolo_dets)),
                },
            )
            detections.append(det)

        return DetectionResult(
            detections=detections,
            processing_time_ms=(time.time() - start) * 1000,
            model_name="yolo_person",
            original_shape=frame.shape[:2],
        )

    @staticmethod
    def _assess_crowd_risk(count: int) -> str:
        if count > 20:
            return "high"
        elif count > 10:
            return "medium"
        return "low"

    def count_humans(self, result: DetectionResult) -> int:
        return len(result.detections)


class CrowdDetector:
    """Crowd analysis using human detector"""

    def __init__(self, human_detector: HumanDetector):
        self.human_detector = human_detector
        self.density_history: list = []

    def analyze_crowd(self, frame: np.ndarray) -> dict:
        result = self.human_detector.detect(frame)
        count = len(result.detections)

        h, w = frame.shape[:2]
        area = max(h * w, 1)
        density = count / (area / 10000)

        self.density_history.append(density)
        if len(self.density_history) > 30:
            self.density_history.pop(0)

        panic_detected = False
        if len(self.density_history) >= 5:
            recent_change = self.density_history[-1] - self.density_history[-5]
            if recent_change > 0.5:
                panic_detected = True

        return {
            "count": count,
            "density": density,
            "panic_detected": panic_detected,
            "risk_level": self._get_risk_level(count, density, panic_detected),
            "detections": result,
        }

    @staticmethod
    def _get_risk_level(count: int, density: float, panic: bool) -> str:
        if panic or count > 50 or density > 2.0:
            return "critical"
        elif count > 20 or density > 1.0:
            return "high"
        elif count > 10:
            return "medium"
        return "low"
