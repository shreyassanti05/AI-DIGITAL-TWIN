"""
YOLOv11 Object Detection Module
Core detector that handles all YOLO inference.
Auto-downloads model weights if not present.
Auto-detects GPU/CPU.
"""

import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np
import cv2

logger = logging.getLogger(__name__)


@dataclass
class Detection:
    """Detection result dataclass"""
    bbox: Tuple[int, int, int, int]  # x1, y1, x2, y2
    confidence: float
    class_id: int
    class_name: str
    track_id: Optional[int] = None
    metadata: Optional[Dict] = None


class YOLODetector:
    """
    YOLOv11 Object Detection wrapper.
    - Auto-downloads yolo11n.pt if no model exists
    - Auto-detects GPU vs CPU
    - Supports person, weapon-proxy (knife/scissors), and general detection
    """

    # COCO dataset class names (80 classes)
    COCO_CLASSES = [
        'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
        'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
        'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
        'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
        'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
        'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
        'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
        'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
        'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
        'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ]

    # Threat-relevant COCO class IDs
    PERSON_CLASS = 0
    KNIFE_CLASS = 43
    SCISSORS_CLASS = 76
    BASEBALL_BAT_CLASS = 34

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        confidence_threshold: float = 0.5,
        nms_threshold: float = 0.45,
        device: str = "auto",
    ):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.nms_threshold = nms_threshold
        self.device = self._resolve_device(device)
        self.model = None
        self._load_model()

    @staticmethod
    def _resolve_device(device: str) -> str:
        """Auto-detect best available device"""
        if device != "auto":
            return device
        try:
            import torch
            if torch.cuda.is_available():
                return "cuda"
            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
        except ImportError:
            pass
        return "cpu"

    def _load_model(self):
        """Load YOLO model - auto-downloads if not found"""
        try:
            from ultralytics import YOLO

            logger.info(f"Loading YOLO model: {self.model_path} on {self.device}")
            self.model = YOLO(self.model_path)  # auto-downloads if not present

            if self.device != "cpu":
                try:
                    self.model.to(self.device)
                except Exception as e:
                    logger.warning(f"GPU not available ({e}), falling back to CPU")
                    self.device = "cpu"

            logger.info(f"✅ YOLO model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"❌ Error loading YOLO model: {e}")
            self.model = None

    def detect(
        self,
        frame: np.ndarray,
        classes: Optional[List[int]] = None,
        conf_threshold: Optional[float] = None,
    ) -> List[Detection]:
        """
        Detect objects in frame.

        Args:
            frame: Input image (BGR format from OpenCV)
            classes: Filter by specific class IDs (e.g., [0] for persons only)
            conf_threshold: Override default confidence threshold

        Returns:
            List of Detection objects
        """
        if self.model is None:
            logger.error("YOLO model not loaded")
            return []

        threshold = conf_threshold or self.confidence_threshold

        try:
            results = self.model(
                frame,
                conf=threshold,
                iou=self.nms_threshold,
                classes=classes,
                verbose=False,
            )

            detections = []
            for result in results:
                if result.boxes is None:
                    continue

                boxes = result.boxes.xyxy.cpu().numpy()
                confidences = result.boxes.conf.cpu().numpy()
                class_ids = result.boxes.cls.cpu().numpy().astype(int)

                for box, conf, cls_id in zip(boxes, confidences, class_ids):
                    x1, y1, x2, y2 = map(int, box)
                    class_name = (
                        self.COCO_CLASSES[cls_id]
                        if cls_id < len(self.COCO_CLASSES)
                        else f"class_{cls_id}"
                    )

                    detection = Detection(
                        bbox=(x1, y1, x2, y2),
                        confidence=float(conf),
                        class_id=int(cls_id),
                        class_name=class_name,
                    )
                    detections.append(detection)

            return detections

        except Exception as e:
            logger.error(f"Detection error: {e}")
            return []

    def detect_persons(self, frame: np.ndarray) -> List[Detection]:
        """Detect only persons (COCO class 0)"""
        return self.detect(frame, classes=[self.PERSON_CLASS])

    def detect_threats(self, frame: np.ndarray) -> List[Detection]:
        """Detect potential threats: persons + weapons (knife/scissors/bat)"""
        threat_class_ids = [
            self.PERSON_CLASS,
            self.KNIFE_CLASS,
            self.SCISSORS_CLASS,
            self.BASEBALL_BAT_CLASS,
        ]
        return self.detect(frame, classes=threat_class_ids)

    def draw_detections(
        self,
        frame: np.ndarray,
        detections: List[Detection],
        color_map: Optional[Dict[int, Tuple[int, int, int]]] = None,
        show_confidence: bool = True,
        show_track_id: bool = True,
    ) -> np.ndarray:
        """Draw detection boxes on frame"""
        output = frame.copy()

        default_colors = {
            0: (0, 255, 0),      # person - green
            43: (0, 0, 255),     # knife - red
            76: (0, 165, 255),   # scissors - orange
            34: (0, 0, 200),     # baseball bat - dark red
        }
        colors = color_map or default_colors

        for det in detections:
            x1, y1, x2, y2 = det.bbox
            color = colors.get(det.class_id, (0, 212, 255))

            # Draw bounding box
            cv2.rectangle(output, (x1, y1), (x2, y2), color, 2)

            # Prepare label
            label_parts = [det.class_name]
            if show_confidence:
                label_parts.append(f"{det.confidence:.0%}")
            if show_track_id and det.track_id is not None:
                label_parts.append(f"ID:{det.track_id}")

            label = " ".join(label_parts)

            # Draw label background
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            label_y = y1 - 10 if y1 - 10 > 10 else y1 + 20
            cv2.rectangle(
                output,
                (x1, label_y - label_size[1] - 5),
                (x1 + label_size[0], label_y + 5),
                color,
                -1,
            )

            # Draw label text
            cv2.putText(
                output, label, (x1, label_y),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2,
            )

        return output

    def get_threat_level(self, detections: List[Detection]) -> str:
        """Calculate threat level based on detections"""
        threat_score = 0
        for det in detections:
            if det.class_name == "person":
                threat_score += 1
            elif det.class_name in ["knife", "scissors"]:
                threat_score += 5
            elif det.class_name == "baseball bat":
                threat_score += 3

        if threat_score >= 8:
            return "critical"
        elif threat_score >= 5:
            return "high"
        elif threat_score >= 3:
            return "medium"
        elif threat_score >= 1:
            return "low"
        return "none"


# Global detector instance (lazy-loaded)
_detector: Optional[YOLODetector] = None


def get_detector() -> YOLODetector:
    """Get or create global detector instance"""
    global _detector
    if _detector is None:
        _detector = YOLODetector()
    return _detector
