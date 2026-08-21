"""
Pose Estimation Module
Uses MediaPipe for human pose detection
"""
import numpy as np
import cv2
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from collections import deque


@dataclass
class PoseKeypoint:
    x: float
    y: float
    z: float
    visibility: float
    name: str


@dataclass
class HumanPose:
    track_id: int
    keypoints: List[PoseKeypoint]
    bbox: Tuple[int, int, int, int]
    confidence: float


class PoseEstimator:
    """
    Human pose estimation using MediaPipe
    """
    
    KEYPOINT_NAMES = [
        "nose", "left_eye", "right_eye", "left_ear", "right_ear",
        "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
        "left_wrist", "right_wrist", "left_hip", "right_hip",
        "left_knee", "right_knee", "left_ankle", "right_ankle"
    ]
    
    # Connections for skeleton drawing
    SKELETON_CONNECTIONS = [
        ("nose", "left_eye"), ("nose", "right_eye"),
        ("left_eye", "left_ear"), ("right_eye", "right_ear"),
        ("left_shoulder", "right_shoulder"),
        ("left_shoulder", "left_elbow"), ("left_elbow", "left_wrist"),
        ("right_shoulder", "right_elbow"), ("right_elbow", "right_wrist"),
        ("left_shoulder", "left_hip"), ("right_shoulder", "right_hip"),
        ("left_hip", "right_hip"),
        ("left_hip", "left_knee"), ("left_knee", "left_ankle"),
        ("right_hip", "right_knee"), ("right_knee", "right_ankle"),
    ]
    
    def __init__(self, static_mode: bool = False, 
                 model_complexity: int = 1,
                 min_detection_confidence: float = 0.5):
        self.static_mode = static_mode
        self.model_complexity = model_complexity
        self.min_detection_confidence = min_detection_confidence
        self.mp_pose = None
        self.pose = None
        self._initialize_mediapipe()
        
    def _initialize_mediapipe(self):
        """Initialize MediaPipe pose estimation"""
        try:
            import mediapipe as mp
            self.mp_pose = mp.solutions.pose
            self.mp_drawing = mp.solutions.drawing_utils
            self.pose = self.mp_pose.Pose(
                static_image_mode=self.static_mode,
                model_complexity=self.model_complexity,
                min_detection_confidence=self.min_detection_confidence,
                min_tracking_confidence=0.5
            )
        except ImportError:
            print("MediaPipe not installed. Pose estimation disabled.")
            self.pose = None
    
    def estimate_pose(self, frame: np.ndarray, bbox: Optional[Tuple] = None) -> Optional[HumanPose]:
        """
        Estimate pose for a person in frame
        
        Args:
            frame: Input image
            bbox: Optional bounding box to crop person (x1, y1, x2, y2)
            
        Returns:
            HumanPose with keypoints
        """
        if self.pose is None:
            return None
        
        # Crop if bbox provided
        if bbox:
            x1, y1, x2, y2 = bbox
            person_img = frame[y1:y2, x1:x2]
        else:
            person_img = frame
            x1, y1 = 0, 0
        
        # Convert BGR to RGB
        rgb = cv2.cvtColor(person_img, cv2.COLOR_BGR2RGB)
        
        # Process
        results = self.pose.process(rgb)
        
        if not results.pose_landmarks:
            return None
        
        # Extract keypoints
        keypoints = []
        landmarks = results.pose_landmarks.landmark
        
        for i, name in enumerate(self.KEYPOINT_NAMES):
            if i < len(landmarks):
                lm = landmarks[i]
                keypoints.append(PoseKeypoint(
                    x=lm.x * person_img.shape[1] + x1,
                    y=lm.y * person_img.shape[0] + y1,
                    z=lm.z,
                    visibility=lm.visibility,
                    name=name
                ))
        
        # Calculate confidence
        visibilities = [kp.visibility for kp in keypoints]
        confidence = np.mean(visibilities)
        
        # Determine bbox if not provided
        if bbox is None:
            xs = [kp.x for kp in keypoints if kp.visibility > 0.5]
            ys = [kp.y for kp in keypoints if kp.visibility > 0.5]
            if xs and ys:
                bbox = (int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)))
            else:
                bbox = (0, 0, frame.shape[1], frame.shape[0])
        
        return HumanPose(
            track_id=-1,  # Will be assigned by tracker
            keypoints=keypoints,
            bbox=bbox,
            confidence=confidence
        )
    
    def detect_fall(self, pose: HumanPose) -> Dict:
        """
        Detect if person has fallen based on pose
        
        Returns fall detection result
        """
        if not pose or len(pose.keypoints) < 15:
            return {"fall_detected": False, "confidence": 0, "reason": "insufficient_keypoints"}
        
        # Get key points
        kp_dict = {kp.name: kp for kp in pose.keypoints}
        
        # Check if required keypoints exist
        required = ["left_shoulder", "right_shoulder", "left_hip", "right_hip",
                   "left_knee", "right_knee"]
        
        if not all(k in kp_dict for k in required):
            return {"fall_detected": False, "confidence": 0, "reason": "missing_keypoints"}
        
        # Calculate vertical alignment
        shoulders_y = (kp_dict["left_shoulder"].y + kp_dict["right_shoulder"].y) / 2
        hips_y = (kp_dict["left_hip"].y + kp_dict["right_hip"].y) / 2
        knees_y = (kp_dict["left_knee"].y + kp_dict["right_knee"].y) / 2
        
        # Check if body is horizontal (fallen)
        shoulder_hip_diff = abs(shoulders_y - hips_y)
        hip_knee_diff = abs(hips_y - knees_y)
        
        # If body parts are at similar height, person might be lying down
        is_horizontal = shoulder_hip_diff < 30 and hip_knee_diff < 30
        
        # Check if body is low to ground
        frame_height = pose.bbox[3] - pose.bbox[1]
        body_low = max(shoulders_y, hips_y, knees_y) > pose.bbox[1] + frame_height * 0.7
        
        fall_detected = is_horizontal and body_low
        
        confidence = 0.0
        if fall_detected:
            confidence = min(1.0, (30 - shoulder_hip_diff) / 30 * (30 - hip_knee_diff) / 30)
        
        return {
            "fall_detected": fall_detected,
            "confidence": confidence,
            "is_horizontal": is_horizontal,
            "body_low": body_low,
            "requires_alert": fall_detected and confidence > 0.7
        }
    
    def draw_pose(self, frame: np.ndarray, pose: HumanPose, 
                  color: Tuple[int, int, int] = (0, 255, 0)) -> np.ndarray:
        """Draw pose skeleton on frame"""
        output = frame.copy()
        
        # Create keypoint dictionary
        kp_dict = {kp.name: (int(kp.x), int(kp.y)) for kp in pose.keypoints if kp.visibility > 0.5}
        
        # Draw connections
        for connection in self.SKELETON_CONNECTIONS:
            if connection[0] in kp_dict and connection[1] in kp_dict:
                pt1 = kp_dict[connection[0]]
                pt2 = kp_dict[connection[1]]
                cv2.line(output, pt1, pt2, color, 2)
        
        # Draw keypoints
        for name, pt in kp_dict.items():
            cv2.circle(output, pt, 4, color, -1)
        
        return output


class FallDetector:
    """
    Specialized fall detection using pose history
    """
    
    def __init__(self, history_size: int = 30):
        self.pose_history = deque(maxlen=history_size)
        self.fall_threshold = 0.7
        self.confirmation_frames = 5
        self.fall_counter = 0
        
    def process_pose(self, pose: HumanPose, timestamp: float) -> Dict:
        """
        Process pose and detect falls
        
        Uses temporal analysis for confirmation
        """
        # Store pose history
        self.pose_history.append({
            "pose": pose,
            "timestamp": timestamp
        })
        
        # Run pose-based fall detection
        pose_estimator = PoseEstimator()
        result = pose_estimator.detect_fall(pose)
        
        # Temporal confirmation
        if result["fall_detected"]:
            self.fall_counter += 1
        else:
            self.fall_counter = max(0, self.fall_counter - 1)
        
        # Confirm fall after consecutive detections
        confirmed = self.fall_counter >= self.confirmation_frames
        
        return {
            "fall_detected": result["fall_detected"],
            "fall_confirmed": confirmed,
            "confidence": result["confidence"],
            "consecutive_frames": self.fall_counter,
            "requires_alert": confirmed,
            "analysis": result
        }
    
    def reset(self):
        """Reset detector state"""
        self.pose_history.clear()
        self.fall_counter = 0
