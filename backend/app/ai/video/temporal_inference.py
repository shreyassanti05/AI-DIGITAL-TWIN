"""
Temporal Inference Engine for Video Activity Recognition

Implements sliding window temporal analysis with:
- Continuous sequence updates
- Dynamic class replacement based on priority
- Temporal confidence aggregation
- Priority-based suspicious activity override

NEVER prioritizes or permanently locks normal activities like:
- Walking, Standing, Sitting, Clapping

Always focuses on detecting MAIN suspicious/anomalous activity.
"""
import logging
import numpy as np
from collections import deque
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class ActivityPrediction:
    """Single prediction with metadata"""
    activity: str
    confidence: float
    timestamp: float
    raw_probs: Optional[np.ndarray] = None


@dataclass
class TemporalActivityState:
    """Aggregated state for an activity class over time"""
    activity: str
    cumulative_confidence: float = 0.0
    detection_count: int = 0
    last_seen: float = 0.0
    peak_confidence: float = 0.0
    avg_confidence: float = 0.0


class TemporalInferenceEngine:
    """
    Sliding window temporal inference for video activity recognition.
    
    Key behaviors:
    1. Continuously analyzes full video stream (not just first frames)
    2. Monitors activity changes over time
    3. Updates predictions dynamically
    4. Suspicious classes override normal classes based on priority
    5. Only outputs stable predictions after sufficient temporal analysis
    """
    
    # Activity priority hierarchy (higher = more important to report)
    # Critical suspicious activities have highest priority
    ACTIVITY_PRIORITY = {
        # Critical threats (highest priority)
        "Shooting": 100,
        "Explosion": 95,
        "Arson": 90,
        # High threats
        "Robbery": 85,
        "Burglary": 80,
        "Fighting": 75,
        "Assault": 70,
        "Abuse": 65,
        # Medium threats
        "Stealing": 60,
        "Shoplifting": 55,
        "Vandalism": 50,
        "Road Accidents": 45,
        "Arrest": 40,
        # Normal activities (lowest priority - should NOT permanently lock)
        "Clapping": 10,
        "Meeting and Splitting": 10,
        "Sitting": 5,
        "Standing Still": 5,
        "Walking": 5,
        "Walking while Reading a Book": 5,
        "Walking while Using Phone": 5,
    }
    
    # Default priority for unknown activities
    DEFAULT_PRIORITY = 30
    
    # Activity classifications
    SUSPICIOUS_ACTIVITIES = {
        "Shooting", "Explosion", "Arson", "Robbery", "Burglary", 
        "Fighting", "Assault", "Abuse", "Stealing", "Shoplifting",
        "Vandalism", "Road Accidents", "Arrest"
    }
    
    NORMAL_ACTIVITIES = {
        "Clapping", "Meeting and Splitting", "Sitting", "Standing Still",
        "Walking", "Walking while Reading a Book", "Walking while Using Phone"
    }
    
    def __init__(
        self,
        window_size: int = 24,  # Frames to analyze (sliding window)
        min_stable_frames: int = 8,  # Minimum frames before outputting prediction
        temporal_smoothing_factor: float = 0.3,
        confidence_decay: float = 0.95,  # Decay factor for old detections
        suspicion_boost: float = 1.3,  # Boost factor for suspicious activities
        min_confidence_threshold: float = 0.35,
    ):
        self.window_size = window_size
        self.min_stable_frames = min_stable_frames
        self.temporal_smoothing_factor = temporal_smoothing_factor
        self.confidence_decay = confidence_decay
        self.suspicion_boost = suspicion_boost
        self.min_confidence_threshold = min_confidence_threshold
        
        # Sliding window of raw predictions
        self.prediction_window: deque = deque(maxlen=window_size)
        
        # Temporal state for each activity
        self.activity_states: Dict[str, TemporalActivityState] = {}
        
        # Output state
        self.current_prediction: Optional[str] = None
        self.current_confidence: float = 0.0
        self.current_threat_level: str = "low"
        self.frames_analyzed: int = 0
        self.stabilization_counter: int = 0
        
        # Track if we've seen enough frames to make a stable prediction
        self.is_stable: bool = False
        
        # Track the best suspicious activity seen so far
        self.best_suspicious_activity: Optional[str] = None
        self.best_suspicious_confidence: float = 0.0
        
    def reset(self):
        """Reset the temporal state"""
        self.prediction_window.clear()
        self.activity_states.clear()
        self.current_prediction = None
        self.current_confidence = 0.0
        self.current_threat_level = "low"
        self.frames_analyzed = 0
        self.stabilization_counter = 0
        self.is_stable = False
        self.best_suspicious_activity = None
        self.best_suspicious_confidence = 0.0
        
    def get_priority(self, activity: str) -> int:
        """Get priority score for an activity (higher = more important)"""
        return self.ACTIVITY_PRIORITY.get(activity, self.DEFAULT_PRIORITY)
    
    def is_suspicious(self, activity: str) -> bool:
        """Check if activity is suspicious/criminal"""
        return activity in self.SUSPICIOUS_ACTIVITIES
    
    def is_normal(self, activity: str) -> bool:
        """Check if activity is normal (low priority)"""
        return activity in self.NORMAL_ACTIVITIES
    
    def should_override(self, new_activity: str, current_activity: str, 
                        new_confidence: float, current_confidence: float) -> bool:
        """
        Determine if new_activity should override current_activity.
        
        Rules:
        1. Suspicious activities override normal activities (even with lower confidence)
        2. Higher priority suspicious activities override lower priority ones
        3. Same category: need significantly higher confidence to switch
        """
        if current_activity == new_activity:
            return False
            
        new_is_suspicious = self.is_suspicious(new_activity)
        current_is_suspicious = self.is_suspicious(current_activity)
        
        # Suspicious always overrides normal
        if new_is_suspicious and not current_is_suspicious:
            return new_confidence >= self.min_confidence_threshold * 0.7
            
        # Normal should NOT override suspicious
        if not new_is_suspicious and current_is_suspicious:
            return False
            
        # Both suspicious: check priority
        if new_is_suspicious and current_is_suspicious:
            new_priority = self.get_priority(new_activity)
            current_priority = self.get_priority(current_activity)
            
            # Higher priority wins with sufficient confidence
            if new_priority > current_priority:
                return new_confidence >= self.min_confidence_threshold * 0.8
            else:
                # Same priority: need higher confidence to switch
                return new_confidence > current_confidence * 1.2
                
        # Both normal: only switch with significantly higher confidence
        return new_confidence > current_confidence * 1.3
    
    def update(self, raw_probs: np.ndarray, class_names: List[str], 
               timestamp: float) -> Dict:
        """
        Update temporal inference with new frame prediction.
        
        Args:
            raw_probs: Raw probability vector from model
            class_names: List of class names corresponding to probabilities
            timestamp: Current timestamp
            
        Returns:
            Dict with current best prediction and metadata
        """
        self.frames_analyzed += 1
        
        # Store prediction in window
        prediction = ActivityPrediction(
            activity=class_names[np.argmax(raw_probs)],
            confidence=float(np.max(raw_probs)),
            timestamp=timestamp,
            raw_probs=raw_probs.copy()
        )
        self.prediction_window.append(prediction)
        
        # Update temporal states for all classes
        self._update_activity_states(raw_probs, class_names, timestamp)
        
        # Decay old detections
        self._decay_old_states(timestamp)
        
        # Compute temporal-smoothed predictions
        smoothed_probs = self._compute_temporal_probabilities(class_names)
        
        # Determine best activity with priority-based selection
        best_activity, best_confidence = self._select_best_activity(
            smoothed_probs, class_names
        )
        
        # Check if we should update current prediction
        should_update = self._should_update_prediction(
            best_activity, best_confidence
        )
        
        if should_update:
            old_activity = self.current_prediction
            self.current_prediction = best_activity
            self.current_confidence = best_confidence
            
            # Update threat level
            if self.is_suspicious(best_activity):
                self.current_threat_level = self._get_threat_level(best_activity)
                
                # Track best suspicious activity
                if best_confidence > self.best_suspicious_confidence:
                    self.best_suspicious_activity = best_activity
                    self.best_suspicious_confidence = best_confidence
            else:
                self.current_threat_level = "low"
            
            if old_activity != best_activity:
                logger.info(
                    f"Activity changed: {old_activity} -> {best_activity} "
                    f"(confidence: {best_confidence:.2f})"
                )
        
        # Check stabilization
        self._update_stabilization()
        
        # Build result
        result = {
            "activity": self.current_prediction,
            "confidence": self.current_confidence,
            "threat_level": self.current_threat_level,
            "is_suspicious": self.is_suspicious(self.current_prediction) if self.current_prediction else False,
            "is_stable": self.is_stable,
            "frames_analyzed": self.frames_analyzed,
            "window_size": len(self.prediction_window),
            "best_suspicious": self.best_suspicious_activity,
            "best_suspicious_confidence": self.best_suspicious_confidence,
        }
        
        # Add class confidences for debugging
        result["class_confidences"] = {
            class_names[i]: float(smoothed_probs[i]) 
            for i in range(len(class_names))
        }
        
        return result
    
    def _update_activity_states(self, raw_probs: np.ndarray, 
                                 class_names: List[str], timestamp: float):
        """Update cumulative confidence for each activity"""
        for i, class_name in enumerate(class_names):
            if i >= len(raw_probs):
                break
                
            confidence = float(raw_probs[i])
            
            # Apply suspicion boost
            if self.is_suspicious(class_name):
                confidence *= self.suspicion_boost
                
            if class_name not in self.activity_states:
                self.activity_states[class_name] = TemporalActivityState(
                    activity=class_name,
                    last_seen=timestamp
                )
            
            state = self.activity_states[class_name]
            state.cumulative_confidence += confidence
            state.detection_count += 1
            state.last_seen = timestamp
            state.peak_confidence = max(state.peak_confidence, confidence)
            state.avg_confidence = state.cumulative_confidence / state.detection_count
    
    def _decay_old_states(self, current_timestamp: float):
        """Decay confidence for activities not seen recently"""
        decay_threshold = 2.0  # seconds
        
        for state in self.activity_states.values():
            time_since_seen = current_timestamp - state.last_seen
            if time_since_seen > decay_threshold:
                # Decay cumulative confidence
                decay_factor = self.confidence_decay ** (time_since_seen / decay_threshold)
                state.cumulative_confidence *= decay_factor
    
    def _compute_temporal_probabilities(self, class_names: List[str]) -> np.ndarray:
        """Compute temporally-smoothed probability distribution"""
        if not self.prediction_window:
            # Return uniform distribution if no predictions
            return np.ones(len(class_names)) / len(class_names)
        
        # Start with most recent prediction
        weights = []
        weighted_sum = np.zeros(len(class_names))
        
        for i, pred in enumerate(self.prediction_window):
            # More recent predictions get higher weight
            weight = (i + 1) ** self.temporal_smoothing_factor
            weights.append(weight)
            
            # Pad or truncate raw_probs to match class_names
            probs = pred.raw_probs if pred.raw_probs is not None else np.zeros(len(class_names))
            if len(probs) < len(class_names):
                probs = np.pad(probs, (0, len(class_names) - len(probs)), 'constant')
            else:
                probs = probs[:len(class_names)]
                
            weighted_sum += weight * probs
        
        # Normalize
        total_weight = sum(weights)
        smoothed = weighted_sum / total_weight if total_weight > 0 else weighted_sum
        
        # Apply softmax for stability
        exp_smooth = np.exp(smoothed - np.max(smoothed))
        smoothed = exp_smooth / np.sum(exp_smooth)
        
        return smoothed
    
    def _select_best_activity(self, smoothed_probs: np.ndarray, 
                               class_names: List[str]) -> Tuple[str, float]:
        """
        Select best activity using priority-weighted scoring.
        
        Priority system ensures suspicious activities are preferred over normal ones.
        """
        best_score = -1
        best_activity = None
        best_confidence = 0.0
        
        for i, class_name in enumerate(class_names):
            if i >= len(smoothed_probs):
                break
                
            confidence = smoothed_probs[i]
            priority = self.get_priority(class_name)
            
            # Score combines confidence and priority
            # Suspicious activities get bonus based on priority
            if self.is_suspicious(class_name):
                priority_bonus = priority / 100.0 * 0.3  # Up to 0.3 bonus
                score = confidence + priority_bonus
            else:
                # Normal activities get penalty to prevent early locking
                score = confidence * 0.7
            
            if score > best_score and confidence > self.min_confidence_threshold * 0.5:
                best_score = score
                best_activity = class_name
                best_confidence = confidence
        
        # Default to most likely if nothing meets threshold
        if best_activity is None and len(smoothed_probs) > 0:
            best_idx = np.argmax(smoothed_probs)
            best_activity = class_names[best_idx]
            best_confidence = smoothed_probs[best_idx]
        
        return best_activity, best_confidence
    
    def _should_update_prediction(self, new_activity: str, 
                                   new_confidence: float) -> bool:
        """Determine if prediction should be updated"""
        # First prediction - always accept if confident enough
        if self.current_prediction is None:
            return new_confidence >= self.min_confidence_threshold * 0.5
        
        # Check for override
        return self.should_override(
            new_activity, self.current_prediction,
            new_confidence, self.current_confidence
        )
    
    def _update_stabilization(self):
        """Update stabilization status"""
        if self.frames_analyzed < self.min_stable_frames:
            self.is_stable = False
            return
            
        # Count how long we've had consistent high confidence
        if self.current_prediction and self.current_confidence >= self.min_confidence_threshold:
            self.stabilization_counter += 1
        else:
            self.stabilization_counter = max(0, self.stabilization_counter - 1)
        
        # Stable after consistent predictions for a while
        self.is_stable = self.stabilization_counter >= self.min_stable_frames // 2
    
    def _get_threat_level(self, activity: str) -> str:
        """Get threat level for an activity"""
        threat_map = {
            "Shooting": "critical",
            "Explosion": "critical",
            "Arson": "critical",
            "Assault": "high",
            "Fighting": "high",
            "Robbery": "high",
            "Burglary": "high",
            "Abuse": "high",
            "Shoplifting": "medium",
            "Stealing": "medium",
            "Vandalism": "medium",
            "Road Accidents": "medium",
            "Arrest": "medium",
        }
        return threat_map.get(activity, "low")
    
    def force_suspicious_override(self, activity: str, confidence: float) -> bool:
        """
        Force override to a suspicious activity.
        Used when external detection (e.g., weapon detection) confirms suspicion.
        """
        if activity in self.SUSPICIOUS_ACTIVITIES:
            if confidence > self.best_suspicious_confidence:
                self.best_suspicious_activity = activity
                self.best_suspicious_confidence = confidence
                
                # Force update current prediction
                if self.should_override(activity, self.current_prediction or "", 
                                        confidence, self.current_confidence):
                    self.current_prediction = activity
                    self.current_confidence = confidence
                    self.current_threat_level = self._get_threat_level(activity)
                    return True
        return False
