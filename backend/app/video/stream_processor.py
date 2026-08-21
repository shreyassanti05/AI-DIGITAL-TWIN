"""
Video Stream Processing Engine
Handles: Webcam, CCTV/RTSP, Uploaded Video Files
Thread-safe, async-compatible, with proper event loop handling.
"""
import asyncio
import cv2
import logging
import numpy as np
import os
import time
import threading
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Any
from collections import deque

logger = logging.getLogger(__name__)


@dataclass
class ProcessingConfig:
    """Stream processing configuration"""
    target_fps: float = 15.0
    frame_skip: int = 2
    enable_tracking: bool = True
    enable_weapon_detection: bool = True
    enable_fire_detection: bool = True
    enable_violence_detection: bool = True
    enable_fall_detection: bool = False
    enable_crowd_analysis: bool = True
    detection_confidence: float = 0.5
    alert_cooldown: int = 60
    max_queue_size: int = 10


@dataclass
class StreamInfo:
    """Stream metadata"""
    stream_id: str = ""
    source: str = ""
    source_url: str = ""
    width: int = 640
    height: int = 480
    fps: float = 30.0
    codec: str = ""
    start_time: float = field(default_factory=time.time)
    frame_count: int = 0
    is_active: bool = True
    error_count: int = 0


class StreamProcessor:
    """
    Real-time video stream processor.
    Uses a single unified YOLO detector for all detection types.
    Handles webcam, RTSP, and file sources.
    """

    def __init__(self, stream_id: str, config: ProcessingConfig):
        self.stream_id = stream_id
        self.config = config
        self.info: Optional[StreamInfo] = None
        self.capture: Optional[cv2.VideoCapture] = None
        self.is_running = False
        self.frame_count = 0

        # Lazy-loaded detectors
        self._yolo_detector = None
        self._tracker = None
        self._violence_detector = None
        self._fire_detector = None
        self._threat_assessor = None
        
        # New Activity Recognition
        self._activity_detector = None
        self._sequence_buffer = None

        # Processing state
        self.processing_thread: Optional[threading.Thread] = None
        self._event_loop: Optional[asyncio.AbstractEventLoop] = None

        # Callbacks
        self.on_detection: Optional[Callable] = None
        self.on_alert: Optional[Callable] = None
        self.on_frame: Optional[Callable] = None

        # Alert tracking
        self.last_alert_time: Dict[str, float] = {}

    def _init_detectors(self):
        """Lazily initialize detectors on first use"""
        if self._yolo_detector is not None:
            return

        try:
            from app.ai.detectors.yolo_detector import get_detector
            self._yolo_detector = get_detector()
            logger.info(f"[{self.stream_id}] YOLO detector initialized")
        except Exception as e:
            logger.error(f"[{self.stream_id}] Failed to init YOLO: {e}")

        try:
            from app.ai.trackers.deepsort_tracker import DeepSortTracker
            if self.config.enable_tracking:
                self._tracker = DeepSortTracker()
        except Exception as e:
            logger.warning(f"[{self.stream_id}] Tracker init failed: {e}")

        try:
            from app.ai.detectors.violence_detector import ViolenceDetector
            if self.config.enable_violence_detection:
                self._violence_detector = ViolenceDetector()
        except Exception as e:
            logger.warning(f"[{self.stream_id}] Violence detector init failed: {e}")

        # Initialize the new sequence-based ActivityDetector with temporal inference
        try:
            from app.ai.detectors.activity_detector import ActivityDetector
            from app.ai.video.sequence_processor import VideoSequenceBuffer
            self._activity_detector = ActivityDetector()
            self._sequence_buffer = VideoSequenceBuffer(
                sequence_length=self._activity_detector.sequence_length,
                frame_size=self._activity_detector.frame_size,
                channels=self._activity_detector.channels
            )
            # Reset temporal state for this new stream
            self._activity_detector.reset_temporal_state()
            logger.info(f"[{self.stream_id}] Activity detector with temporal inference initialized")
        except Exception as e:
            logger.warning(f"[{self.stream_id}] Activity sequence detector init failed: {e}")

        try:
            from app.ai.detectors.fire_detector import FireDetector
            if self.config.enable_fire_detection:
                self._fire_detector = FireDetector()
        except Exception as e:
            logger.warning(f"[{self.stream_id}] Fire detector init failed: {e}")

        try:
            from app.ai.detectors.weapon_detector import ThreatAssessor
            self._threat_assessor = ThreatAssessor()
        except Exception as e:
            logger.warning(f"[{self.stream_id}] Threat assessor init failed: {e}")

    async def start(self, source: str, source_type: str = "auto") -> bool:
        """Start processing a video stream"""
        # Capture event loop for thread-safe callback scheduling
        try:
            self._event_loop = asyncio.get_running_loop()
        except RuntimeError:
            self._event_loop = asyncio.get_event_loop()

        # Determine source type
        if source_type == "auto":
            if isinstance(source, str) and source.isdigit():
                source_type = "webcam"
            elif isinstance(source, str) and source.startswith("rtsp://"):
                source_type = "rtsp"
            elif isinstance(source, str) and os.path.isfile(source):
                source_type = "file"
            else:
                source_type = "webcam"

        # Open video capture
        if source_type == "webcam":
            cap_source = int(source) if isinstance(source, str) and source.isdigit() else 0
            # Use DirectShow on Windows for much faster/reliable webcam access
            if os.name == 'nt':
                self.capture = cv2.VideoCapture(cap_source, cv2.CAP_DSHOW)
            else:
                self.capture = cv2.VideoCapture(cap_source)
        else:
            cap_source = source
            self.capture = cv2.VideoCapture(cap_source)

        if not self.capture.isOpened():
            # Try fallback webcam indices
            if source_type == "webcam":
                for idx in [0, 1, 2]:
                    if os.name == 'nt':
                        self.capture = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
                    else:
                        self.capture = cv2.VideoCapture(idx)
                    if self.capture.isOpened():
                        logger.info(f"[{self.stream_id}] Opened webcam at index {idx}")
                        break
                else:
                    logger.error(f"[{self.stream_id}] No webcam found")
                    return False
            else:
                logger.error(f"[{self.stream_id}] Failed to open: {source}")
                return False

        # Set buffer size for low latency
        self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        # RTSP optimizations
        if source_type == "rtsp":
            self.capture.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'H264'))

        # Get properties
        width = int(self.capture.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        height = int(self.capture.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        fps = self.capture.get(cv2.CAP_PROP_FPS) or 30.0

        self.info = StreamInfo(
            stream_id=self.stream_id,
            source=source_type,
            source_url=str(source),
            width=width,
            height=height,
            fps=fps,
        )

        self.is_running = True

        # Start processing in background thread
        self.processing_thread = threading.Thread(
            target=self._processing_loop, daemon=True, name=f"stream-{self.stream_id}"
        )
        self.processing_thread.start()

        logger.info(f"✅ [{self.stream_id}] Stream started: {source_type} {width}x{height} @ {fps}fps")
        return True

    def stop(self):
        """Stop the stream processor"""
        self.is_running = False
        if self.info:
            self.info.is_active = False

        if self.processing_thread and self.processing_thread.is_alive():
            self.processing_thread.join(timeout=5.0)

        if self.capture:
            self.capture.release()
            self.capture = None

        logger.info(f"🛑 [{self.stream_id}] Stream stopped")

    def _processing_loop(self):
        """Main processing loop (runs in background thread)"""
        self._init_detectors()

        frame_time = 1.0 / max(self.config.target_fps, 1)
        last_frame_time = 0.0
        consecutive_errors = 0
        max_errors = 100

        while self.is_running:
            current_time = time.time()

            # Frame rate control
            if current_time - last_frame_time < frame_time:
                time.sleep(0.001)
                continue

            last_frame_time = current_time

            # Read frame
            if self.capture is None or not self.capture.isOpened():
                consecutive_errors += 1
                if consecutive_errors > max_errors:
                    logger.error(f"[{self.stream_id}] Too many errors, stopping")
                    break
                time.sleep(0.1)
                continue

            ret, frame = self.capture.read()
            if not ret or frame is None:
                consecutive_errors += 1
                if self.info:
                    self.info.error_count += 1

                # For file sources, end of video
                if self.info and self.info.source == "file":
                    logger.info(f"[{self.stream_id}] End of video file")
                    break

                if consecutive_errors > max_errors:
                    logger.error(f"[{self.stream_id}] Too many read errors, stopping")
                    break

                time.sleep(0.05)
                continue

            consecutive_errors = 0
            self.frame_count += 1
            if self.info:
                self.info.frame_count = self.frame_count
                self.info.error_count = 0

            # Frame skip
            if self.frame_count % (self.config.frame_skip + 1) != 0:
                continue

            # Process frame
            try:
                result = self._process_frame(frame)

                # Send to callback (thread-safe)
                if self.on_frame and self._event_loop:
                    try:
                        asyncio.run_coroutine_threadsafe(
                            self._safe_callback(self.on_frame, frame, result),
                            self._event_loop,
                        )
                    except RuntimeError:
                        pass

            except Exception as e:
                logger.error(f"[{self.stream_id}] Frame processing error: {e}")

        self.is_running = False
        if self.info:
            self.info.is_active = False

    async def _safe_callback(self, callback, *args):
        """Safely invoke async callback"""
        try:
            await callback(*args)
        except Exception as e:
            logger.error(f"[{self.stream_id}] Callback error: {e}")

    def _process_frame(self, frame: np.ndarray) -> Dict:
        """Process a single frame through all detection pipelines"""
        start_time = time.time()
        timestamp = time.time()

        all_detections: List[Dict] = []
        alerts: List[Dict] = []

        # 1. YOLO Detection (persons + weapon proxies)
        if self._yolo_detector:
            # Detect everything relevant
            yolo_dets = self._yolo_detector.detect(
                frame, conf_threshold=self.config.detection_confidence
            )

            person_dets = []
            weapon_dets = []

            for det in yolo_dets:
                det_dict = {
                    "type": "human" if det.class_name == "person" else det.class_name,
                    "bbox": list(det.bbox),
                    "confidence": det.confidence,
                    "class_name": det.class_name,
                    "class_id": det.class_id,
                }

                if det.class_name == "person":
                    person_dets.append(det)
                    det_dict["type"] = "human"
                elif det.class_name in ["knife", "scissors", "baseball bat"]:
                    weapon_dets.append(det)
                    det_dict["type"] = "weapon"
                    det_dict["weapon_type"] = det.class_name
                    det_dict["threat_level"] = "high" if det.class_name == "knife" else "medium"

                    alerts.append({
                        "type": "weapon",
                        "level": "critical" if det.class_name == "knife" else "high",
                        "message": f"{det.class_name.upper()} detected! Confidence: {det.confidence:.0%}",
                        "timestamp": timestamp,
                        "bbox": list(det.bbox),
                    })

                all_detections.append(det_dict)

            # 2. Tracking
            if self._tracker and person_dets:
                tracks = self._tracker.update(person_dets)
                for det_dict in all_detections:
                    if det_dict["type"] == "human":
                        for track in tracks:
                            if self._iou(det_dict["bbox"], list(track.bbox)) > 0.5:
                                det_dict["track_id"] = track.track_id
                                break

            # 3. Crowd analysis
            person_count = len(person_dets)
            if person_count > 20:
                alerts.append({
                    "type": "crowd",
                    "level": "critical",
                    "message": f"Dangerous crowd: {person_count} people",
                    "timestamp": timestamp,
                })
            elif person_count > 10:
                alerts.append({
                    "type": "crowd",
                    "level": "high",
                    "message": f"Large crowd: {person_count} people",
                    "timestamp": timestamp,
                })

        # 4. Fire detection
        if self._fire_detector and self.config.enable_fire_detection:
            try:
                fire_result = self._fire_detector.detect(frame)
                for det in fire_result.detections:
                    all_detections.append({
                        "type": "fire",
                        "bbox": list(det.bbox),
                        "confidence": det.confidence,
                        "hazard_type": det.class_name,
                        "threat_level": det.metadata.get("threat_level", "medium"),
                    })
                    threat = det.metadata.get("threat_level", "medium")
                    if threat in ["high", "critical"]:
                        alerts.append({
                            "type": "fire",
                            "level": threat,
                            "message": f"{det.class_name.upper()} detected!",
                            "timestamp": timestamp,
                            "bbox": list(det.bbox),
                        })
            except Exception as e:
                logger.debug(f"Fire detection error: {e}")

        # 5. Violence detection
        if self._violence_detector and self.config.enable_violence_detection:
            try:
                violence_result = self._violence_detector.analyze_frame(frame)
                if violence_result.get("requires_alert"):
                    all_detections.append({
                        "type": "violence",
                        "confidence": violence_result["confidence"],
                        "violence_detected": True,
                    })
                    alerts.append({
                        "type": "violence",
                        "level": "high",
                        "message": f"Violent activity detected! Confidence: {violence_result['confidence']:.0%}",
                        "timestamp": timestamp,
                    })
            except Exception as e:
                logger.debug(f"Violence detection error: {e}")

        # 6. Sequence-based Deep Activity Recognition (.keras model)
        # Uses temporal inference: sliding window with priority-based suspicious activity override
        if self._activity_detector and self._sequence_buffer:
            try:
                self._sequence_buffer.add_frame(frame)
                
                if self._sequence_buffer.is_ready() and self.frame_count % 4 == 0:
                    sequence = self._sequence_buffer.get_sequence()
                    result = self._activity_detector.analyze_sequence(sequence)
                    
                    activity = result.get("activity", "analyzing")
                    is_stable = result.get("is_stable", False)
                    is_suspicious = result.get("is_suspicious", False)
                    confidence = result.get("confidence", 0.0)
                    
                    # Skip error states and analyzing state (don't add to detections yet)
                    if activity not in ["error", "unknown"]:
                        # Add debug log as requested by user
                        logger.info(f"Predicted Class: {activity}")
                        logger.info(f"Confidence: {confidence:.1%}")
                        logger.info(f"Is Stable: {is_stable}, Is Suspicious: {is_suspicious}")
                        
                        # TEMPORAL INFERENCE LOGIC:
                        # 1. Suspicious activities can override normal ones at any time
                        # 2. Only show stable predictions OR suspicious detections
                        # 3. "analyzing" state means not enough temporal data yet
                        
                        should_report = False
                        
                        if is_suspicious:
                            # Always report suspicious activities immediately
                            should_report = True
                            logger.info(f"SUSPICIOUS ACTIVITY DETECTED: {activity}")
                        elif is_stable and activity != "analyzing":
                            # Only report normal activities if stable (enough temporal analysis)
                            should_report = True
                        elif activity == "analyzing":
                            # Not enough temporal data - show neutral status
                            logger.info("Temporal inference: still analyzing...")
                        
                        if should_report:
                            all_detections.append({
                                "type": "video_activity",
                                "activity": activity,
                                "confidence": confidence,
                                "threat_level": result.get("threat_level", "low"),
                                "is_suspicious": is_suspicious,
                                "is_stable": is_stable,
                                "frames_analyzed": result.get("frames_analyzed", 0)
                            })
                            
                            # Push to alerts with temporal context
                            # Suspicious activities get urgent messaging
                            if is_suspicious:
                                alerts.append({
                                    "type": "activity",
                                    "level": result.get("threat_level", "high"),
                                    "message": f"[ALERT: {activity.upper()} DETECTED] Confidence: {confidence:.0%}",
                                    "timestamp": timestamp,
                                    "priority": "high"  # Suspicious activities are high priority
                                })
                            elif is_stable:
                                # Only alert for stable normal activities (not early-frame guesses)
                                alerts.append({
                                    "type": "activity",
                                    "level": "low",
                                    "message": f"[{activity}] Confidence: {confidence:.0%}",
                                    "timestamp": timestamp,
                                    "priority": "low"
                                })
            except Exception as e:
                logger.debug(f"Video activity sequence processing error: {e}")
                import traceback
                logger.debug(traceback.format_exc())

        # 7. Threat assessment
        threat_data = {"overall_level": "low", "score": 0, "triggers": []}
        if self._threat_assessor:
            try:
                threat_data = self._threat_assessor.calculate_threat_score(all_detections)
            except Exception:
                pass

        # Filter alerts by cooldown
        filtered_alerts = self._filter_alerts(alerts, timestamp)

        # Send alerts via callback
        for alert in filtered_alerts:
            if self.on_alert and self._event_loop:
                try:
                    asyncio.run_coroutine_threadsafe(
                        self._safe_callback(self.on_alert, alert, self.stream_id),
                        self._event_loop,
                    )
                except RuntimeError:
                    pass

        processing_time = (time.time() - start_time) * 1000

        return {
            "stream_id": self.stream_id,
            "timestamp": timestamp,
            "frame_number": self.frame_count,
            "detections": all_detections,
            "alerts": filtered_alerts,
            "threat_assessment": threat_data,
            "processing_time_ms": processing_time,
            "fps": 1000.0 / max(processing_time, 1),
            "human_count": sum(1 for d in all_detections if d.get("type") == "human"),
        }

    @staticmethod
    def _iou(bbox1: list, bbox2: list) -> float:
        """Calculate IoU between two bounding boxes"""
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

    def _filter_alerts(self, alerts: List[Dict], timestamp: float) -> List[Dict]:
        """Filter alerts based on cooldown"""
        filtered = []
        for alert in alerts:
            alert_key = f"{alert['type']}:{alert.get('track_id', 'global')}"
            last_time = self.last_alert_time.get(alert_key, 0)
            if timestamp - last_time >= self.config.alert_cooldown:
                filtered.append(alert)
                self.last_alert_time[alert_key] = timestamp
        return filtered

    def draw_overlays(self, frame: np.ndarray, result: Dict) -> np.ndarray:
        """Draw detection overlays on frame for visualization"""
        output = frame.copy()

        for det in result.get("detections", []):
            det_type = det.get("type", "")
            bbox = det.get("bbox")
            if bbox is None:
                continue

            x1, y1, x2, y2 = map(int, bbox[:4])

            colors = {
                "human": (0, 255, 0),
                "weapon": (0, 0, 255),
                "fire": (0, 165, 255),
                "smoke": (128, 128, 128),
                "violence": (255, 0, 255),
                "fall": (255, 0, 0),
            }
            color = colors.get(det_type, (0, 212, 255))

            cv2.rectangle(output, (x1, y1), (x2, y2), color, 2)

            label = f"{det_type.upper()}"
            if "confidence" in det:
                label += f" {det['confidence']:.0%}"
            if "track_id" in det:
                label += f" ID:{det['track_id']}"

            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            cv2.rectangle(output, (x1, y1 - label_size[1] - 10),
                         (x1 + label_size[0], y1), color, -1)
            cv2.putText(output, label, (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Draw Video Activity Text Overlay with temporal inference state
        video_activities = [d for d in result.get("detections", []) if d.get("type") == "video_activity"]
        if video_activities:
            # Take the latest activity inference
            act = video_activities[-1]
            act_label = act.get("activity", "Unknown")
            conf = act.get("confidence", 0.0)
            suspicious = act.get("is_suspicious", False)
            is_stable = act.get("is_stable", False)
            frames_analyzed = act.get("frames_analyzed", 0)
            
            # Color coding based on threat level and stability
            if suspicious:
                color = (0, 0, 255)  # Red for suspicious
            elif is_stable:
                color = (0, 255, 0)  # Green for stable normal
            else:
                color = (0, 165, 255)  # Orange for analyzing
            
            # Main activity text
            if act_label == "analyzing":
                text = f"Activity: Analyzing... ({frames_analyzed} frames)"
            else:
                text = f"Activity: {act_label} ({conf:.0%})"
                if not is_stable and suspicious:
                    text += " [DETECTING]"
                elif is_stable:
                    text += " [CONFIRMED]"
            
            cv2.putText(output, text, (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        else:
            # No activity detected yet - show analyzing status
            cv2.putText(output, "Activity: Analyzing...", (10, 110),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (128, 128, 128), 2)

        # Threat level overlay
        threat = result.get("threat_assessment", {})
        level = threat.get("overall_level", "low")
        score = threat.get("score", 0)
        threat_text = f"THREAT: {level.upper()} ({score:.0f})"
        threat_color = {
            "low": (0, 255, 0), "medium": (0, 255, 255),
            "high": (0, 165, 255), "critical": (0, 0, 255),
        }.get(level, (128, 128, 128))
        cv2.putText(output, threat_text, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, threat_color, 2)

        # FPS overlay
        fps = result.get("fps", 0)
        cv2.putText(output, f"FPS: {fps:.1f}", (10, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

        # Detection count
        human_count = result.get("human_count", 0)
        cv2.putText(output, f"People: {human_count}", (10, 85),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        return output


class StreamManager:
    """Manages multiple concurrent video streams"""

    def __init__(self):
        self.processors: Dict[str, StreamProcessor] = {}
        self.stream_info: Dict[str, StreamInfo] = {}

    async def add_stream(self, stream_id: str, source: str,
                        config: Optional[ProcessingConfig] = None) -> bool:
        if stream_id in self.processors:
            logger.warning(f"Stream {stream_id} already exists")
            return False

        config = config or ProcessingConfig()
        processor = StreamProcessor(stream_id, config)

        success = await processor.start(source)
        if success:
            self.processors[stream_id] = processor
            self.stream_info[stream_id] = processor.info
            return True
        return False

    def remove_stream(self, stream_id: str):
        if stream_id in self.processors:
            self.processors[stream_id].stop()
            del self.processors[stream_id]
            if stream_id in self.stream_info:
                del self.stream_info[stream_id]

    def get_stream(self, stream_id: str) -> Optional[StreamProcessor]:
        return self.processors.get(stream_id)

    def list_streams(self) -> List[Dict]:
        return [
            {
                "stream_id": sid,
                "source": info.source,
                "resolution": f"{info.width}x{info.height}",
                "fps": info.fps,
                "frame_count": info.frame_count,
                "is_active": info.is_active,
                "runtime": time.time() - info.start_time,
            }
            for sid, info in self.stream_info.items()
        ]

    def stop_all(self):
        for processor in self.processors.values():
            processor.stop()
        self.processors.clear()
        self.stream_info.clear()
