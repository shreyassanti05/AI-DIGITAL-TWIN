"""
Base Detector Class for All AI Detection Modules
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import cv2


@dataclass
class Detection:
    """Single detection result"""
    class_id: int
    class_name: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    track_id: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DetectionResult:
    """Complete detection result for a frame"""
    frame_id: int = 0
    timestamp: float = 0.0
    detections: List[Detection] = field(default_factory=list)
    processing_time_ms: float = 0.0
    model_name: str = ""
    original_shape: Tuple[int, int] = (0, 0)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def get_by_class(self, class_name: str) -> List[Detection]:
        """Get detections filtered by class name"""
        return [d for d in self.detections if d.class_name == class_name]

    def get_high_confidence(self, threshold: float = 0.7) -> List[Detection]:
        """Get high confidence detections"""
        return [d for d in self.detections if d.confidence >= threshold]


class BaseDetector(ABC):
    """Abstract base class for all detectors"""

    def __init__(self, confidence_threshold: float = 0.5):
        self.confidence_threshold = confidence_threshold

    @abstractmethod
    def detect(self, frame: np.ndarray) -> DetectionResult:
        pass

    def draw_detections(self, frame: np.ndarray, result: DetectionResult,
                       draw_bbox: bool = True, draw_conf: bool = True,
                       draw_track_id: bool = True) -> np.ndarray:
        """Draw detection results on frame"""
        output = frame.copy()

        for det in result.detections:
            x1, y1, x2, y2 = det.bbox

            if det.confidence >= 0.8:
                color = (0, 255, 0)
            elif det.confidence >= 0.5:
                color = (0, 255, 255)
            else:
                color = (0, 0, 255)

            if draw_bbox:
                cv2.rectangle(output, (x1, y1), (x2, y2), color, 2)

            label_parts = [det.class_name]
            if draw_conf:
                label_parts.append(f"{det.confidence:.2f}")
            if draw_track_id and det.track_id is not None:
                label_parts.append(f"ID:{det.track_id}")

            label = " | ".join(label_parts)
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            cv2.rectangle(output, (x1, y1 - label_size[1] - 10),
                         (x1 + label_size[0], y1), color, -1)
            cv2.putText(output, label, (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

        return output
