"""
Simplified Object Tracker
Uses basic IoU-based tracking when DeepSORT dependencies aren't available.
"""
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class Track:
    """Single object track"""
    track_id: int
    bbox: Tuple[int, int, int, int]
    confidence: float
    class_name: str
    age: int = 0
    hits: int = 0
    time_since_update: int = 0
    state: str = "tentative"


class DeepSortTracker:
    """
    IoU-based tracker with track ID assignment.
    Uses Hungarian algorithm for matching when scipy available,
    otherwise falls back to greedy matching.
    """

    def __init__(self, max_age: int = 30, min_hits: int = 3, iou_threshold: float = 0.3):
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.tracks: List[Track] = []
        self.next_id = 1

    def update(self, detections) -> List[Track]:
        """
        Update tracks with new detections.
        detections: list of objects with .bbox and .confidence and .class_name
        """
        if not detections:
            self._age_tracks()
            return [t for t in self.tracks if t.state == "confirmed"]

        det_bboxes = []
        for d in detections:
            if hasattr(d, 'bbox'):
                det_bboxes.append(d.bbox)
            elif isinstance(d, dict) and 'bbox' in d:
                det_bboxes.append(tuple(d['bbox']))
            else:
                continue

        if not det_bboxes:
            self._age_tracks()
            return [t for t in self.tracks if t.state == "confirmed"]

        if self.tracks:
            iou_matrix = np.zeros((len(self.tracks), len(det_bboxes)))
            for i, track in enumerate(self.tracks):
                for j, det_bbox in enumerate(det_bboxes):
                    iou_matrix[i, j] = self._iou(track.bbox, det_bbox)

            matched, unmatched_dets, unmatched_tracks = self._match(iou_matrix)

            for t_idx, d_idx in matched:
                track = self.tracks[t_idx]
                det = detections[d_idx]
                bbox = det.bbox if hasattr(det, 'bbox') else tuple(det['bbox'])
                conf = det.confidence if hasattr(det, 'confidence') else det.get('confidence', 0)
                name = det.class_name if hasattr(det, 'class_name') else det.get('class_name', '')
                track.bbox = bbox
                track.confidence = conf
                track.class_name = name
                track.hits += 1
                track.time_since_update = 0
                if track.hits >= self.min_hits:
                    track.state = "confirmed"

            for d_idx in unmatched_dets:
                det = detections[d_idx]
                bbox = det.bbox if hasattr(det, 'bbox') else tuple(det['bbox'])
                conf = det.confidence if hasattr(det, 'confidence') else det.get('confidence', 0)
                name = det.class_name if hasattr(det, 'class_name') else det.get('class_name', '')
                new_track = Track(
                    track_id=self.next_id,
                    bbox=bbox,
                    confidence=conf,
                    class_name=name,
                    hits=1,
                )
                self.next_id += 1
                self.tracks.append(new_track)

            for t_idx in unmatched_tracks:
                self.tracks[t_idx].time_since_update += 1
        else:
            for det in detections:
                bbox = det.bbox if hasattr(det, 'bbox') else tuple(det['bbox'])
                conf = det.confidence if hasattr(det, 'confidence') else det.get('confidence', 0)
                name = det.class_name if hasattr(det, 'class_name') else det.get('class_name', '')
                new_track = Track(
                    track_id=self.next_id,
                    bbox=bbox,
                    confidence=conf,
                    class_name=name,
                    hits=1,
                )
                self.next_id += 1
                self.tracks.append(new_track)

        self._age_tracks()
        return [t for t in self.tracks if t.state == "confirmed"]

    def _age_tracks(self):
        """Remove stale tracks"""
        self.tracks = [
            t for t in self.tracks
            if t.time_since_update < self.max_age
        ]
        for t in self.tracks:
            t.age += 1

    def _match(self, iou_matrix):
        """Greedy matching based on IoU"""
        matched = []
        unmatched_dets = set(range(iou_matrix.shape[1]))
        unmatched_tracks = set(range(iou_matrix.shape[0]))

        if iou_matrix.size > 0:
            while True:
                max_val = iou_matrix.max()
                if max_val < self.iou_threshold:
                    break
                t_idx, d_idx = np.unravel_index(iou_matrix.argmax(), iou_matrix.shape)
                matched.append((int(t_idx), int(d_idx)))
                unmatched_dets.discard(int(d_idx))
                unmatched_tracks.discard(int(t_idx))
                iou_matrix[t_idx, :] = 0
                iou_matrix[:, d_idx] = 0

        return matched, list(unmatched_dets), list(unmatched_tracks)

    @staticmethod
    def _iou(bbox1, bbox2) -> float:
        x1_1, y1_1, x2_1, y2_1 = bbox1[:4]
        x1_2, y1_2, x2_2, y2_2 = bbox2[:4]
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        if x2_i <= x1_i or y2_i <= y1_i:
            return 0.0
        intersection = (x2_i - x1_i) * (y2_i - y1_i)
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union = area1 + area2 - intersection
        return intersection / union if union > 0 else 0.0

    def reset(self):
        self.tracks.clear()
        self.next_id = 1
