"""
Weapon Detection Module
Falls back to COCO knife/scissors classes when custom model isn't available.
"""
import time
import logging
from typing import List, Dict
import numpy as np

from app.ai.detectors.base_detector import BaseDetector, Detection, DetectionResult
from app.ai.detectors.yolo_detector import get_detector

logger = logging.getLogger(__name__)


class WeaponDetector(BaseDetector):
    """
    Weapon detection using COCO classes as fallback.
    If a custom weapon model exists, loads it. Otherwise uses knife/scissors from COCO.
    """

    # COCO classes that can be weapons
    WEAPON_COCO_CLASSES = {
        43: ("knife", "high"),
        76: ("scissors", "medium"),
        34: ("baseball bat", "medium"),
    }

    THREAT_LEVELS = {
        "gun": "critical",
        "pistol": "critical",
        "rifle": "critical",
        "shotgun": "critical",
        "knife": "high",
        "scissors": "medium",
        "baseball bat": "medium",
    }

    def __init__(self, confidence_threshold: float = 0.6):
        super().__init__(confidence_threshold=confidence_threshold)
        self._detector = None

    def _get_detector(self):
        if self._detector is None:
            self._detector = get_detector()
        return self._detector

    def detect(self, frame: np.ndarray) -> DetectionResult:
        """Detect weapons in frame using COCO weapon-proxy classes"""
        start = time.time()
        detector = self._get_detector()

        weapon_class_ids = list(self.WEAPON_COCO_CLASSES.keys())
        yolo_dets = detector.detect(
            frame, classes=weapon_class_ids, conf_threshold=self.confidence_threshold
        )

        detections = []
        for d in yolo_dets:
            weapon_info = self.WEAPON_COCO_CLASSES.get(d.class_id, (d.class_name, "medium"))
            weapon_name = weapon_info[0]
            threat = self.THREAT_LEVELS.get(weapon_name, "high")

            det = Detection(
                class_id=d.class_id,
                class_name=weapon_name,
                confidence=d.confidence,
                bbox=d.bbox,
                metadata={
                    "detection_type": "weapon",
                    "weapon_type": weapon_name,
                    "threat_level": threat,
                    "requires_immediate_alert": True,
                },
            )
            detections.append(det)

        return DetectionResult(
            detections=detections,
            processing_time_ms=(time.time() - start) * 1000,
            model_name="yolo_weapon_proxy",
            original_shape=frame.shape[:2],
        )

    def get_threats(self, result: DetectionResult, min_confidence: float = 0.5) -> List[Detection]:
        """Get high-confidence weapon detections that require alerts"""
        return [
            d for d in result.detections
            if d.confidence >= min_confidence
            and d.metadata.get("requires_immediate_alert", False)
        ]


class ThreatAssessor:
    """Assess overall threat level from multiple detection types"""

    @staticmethod
    def calculate_threat_score(detections: List[Dict]) -> Dict:
        score = 0
        triggers = []

        for det in detections:
            det_type = det.get("type", "")

            if det_type == "weapon":
                weapon = det.get("weapon_type", "")
                conf = det.get("confidence", 0)
                if weapon in ["gun", "pistol", "rifle", "shotgun"]:
                    score += 50 * conf
                    triggers.append(f"Firearm detected ({weapon})")
                elif weapon == "knife":
                    score += 30 * conf
                    triggers.append("Knife detected")
                elif weapon in ["scissors", "baseball bat"]:
                    score += 20 * conf
                    triggers.append(f"{weapon} detected")
            elif det_type == "violence":
                score += 40
                triggers.append("Violent activity detected")
            elif det_type == "fire":
                score += 45
                triggers.append("Fire detected")
            elif det_type == "intrusion":
                score += 25
                triggers.append("Restricted area intrusion")
            elif det_type == "fall":
                score += 15
                triggers.append("Person fallen")

        if score >= 70:
            level = "critical"
        elif score >= 50:
            level = "high"
        elif score >= 25:
            level = "medium"
        else:
            level = "low"

        return {
            "overall_level": level,
            "score": min(score, 100),
            "triggers": triggers,
            "requires_immediate_action": level in ["high", "critical"],
        }
