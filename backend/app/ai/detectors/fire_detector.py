"""
Fire & Smoke Detection Module
Falls back to color-based detection when AI model not available.
"""
import time
import logging
from typing import List, Dict
import numpy as np
import cv2

from app.ai.detectors.base_detector import BaseDetector, Detection, DetectionResult

logger = logging.getLogger(__name__)


class FireDetector(BaseDetector):
    """
    Fire and smoke detection.
    Uses color-based analysis as primary method (works without custom model).
    """

    def __init__(self, confidence_threshold: float = 0.5):
        super().__init__(confidence_threshold=confidence_threshold)
        self.prev_frame_gray = None

    def detect(self, frame: np.ndarray) -> DetectionResult:
        """Detect fire/smoke in frame using color analysis"""
        start = time.time()

        detections = []
        fire_regions = self._detect_fire_color(frame)
        smoke_regions = self._detect_smoke(frame)

        frame_area = max(frame.shape[0] * frame.shape[1], 1)

        for region in fire_regions:
            x1, y1, x2, y2 = region["bbox"]
            area = (x2 - x1) * (y2 - y1)
            coverage = (area / frame_area) * 100

            det = Detection(
                class_id=0,
                class_name="fire",
                confidence=region["confidence"],
                bbox=(x1, y1, x2, y2),
                metadata={
                    "detection_type": "fire",
                    "hazard_type": "fire",
                    "area_coverage_percent": coverage,
                    "threat_level": self._get_threat_level("fire", coverage),
                },
            )
            if det.confidence >= self.confidence_threshold:
                detections.append(det)

        for region in smoke_regions:
            x1, y1, x2, y2 = region["bbox"]
            area = (x2 - x1) * (y2 - y1)
            coverage = (area / frame_area) * 100

            det = Detection(
                class_id=1,
                class_name="smoke",
                confidence=region["confidence"],
                bbox=(x1, y1, x2, y2),
                metadata={
                    "detection_type": "fire",
                    "hazard_type": "smoke",
                    "area_coverage_percent": coverage,
                    "threat_level": self._get_threat_level("smoke", coverage),
                },
            )
            if det.confidence >= self.confidence_threshold:
                detections.append(det)

        return DetectionResult(
            detections=detections,
            processing_time_ms=(time.time() - start) * 1000,
            model_name="fire_color_analysis",
            original_shape=frame.shape[:2],
        )

    @staticmethod
    def _get_threat_level(hazard_type: str, coverage: float) -> str:
        if coverage > 30:
            return "critical"
        elif hazard_type == "fire" and coverage > 10:
            return "high"
        elif coverage > 5:
            return "medium"
        return "low"

    @staticmethod
    def _detect_fire_color(frame: np.ndarray) -> List[Dict]:
        """Detect fire using color analysis in HSV space"""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        fire_ranges = [
            (np.array([0, 100, 100]), np.array([20, 255, 255])),
            (np.array([20, 100, 100]), np.array([40, 255, 255])),
        ]

        combined_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
        for lower, upper in fire_ranges:
            mask = cv2.inRange(hsv, lower, upper)
            combined_mask = cv2.bitwise_or(combined_mask, mask)

        # Morphological operations to clean noise
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
        combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        regions = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 1000:  # Filter small noise
                x, y, w, h = cv2.boundingRect(cnt)
                confidence = min(area / 15000, 0.85)
                regions.append({
                    "bbox": (x, y, x + w, y + h),
                    "area": area,
                    "confidence": confidence,
                })

        return regions

    def _detect_smoke(self, frame: np.ndarray) -> List[Dict]:
        """Detect smoke using gray tone analysis and motion"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        if self.prev_frame_gray is None:
            self.prev_frame_gray = gray
            return []

        # Look for gray/white regions with motion
        diff = cv2.absdiff(self.prev_frame_gray, gray)
        self.prev_frame_gray = gray

        _, motion_mask = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)

        # Smoke is typically gray (low saturation)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        smoke_mask = cv2.inRange(hsv, np.array([0, 0, 100]), np.array([180, 60, 220]))

        combined = cv2.bitwise_and(smoke_mask, motion_mask)

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        regions = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 2000:
                x, y, w, h = cv2.boundingRect(cnt)
                confidence = min(area / 20000, 0.7)
                regions.append({
                    "bbox": (x, y, x + w, y + h),
                    "area": area,
                    "confidence": confidence,
                })

        return regions
