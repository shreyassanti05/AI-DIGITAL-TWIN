import logging
import numpy as np
from typing import Dict, List, Optional
from app.ai.model_loader import model_loader
from app.ai.video.sequence_processor import VideoSequenceBuffer
from app.ai.video.temporal_inference import TemporalInferenceEngine

logger = logging.getLogger(__name__)

class ActivityDetector:
    """
    Video Activity Recognition Detector with Temporal Inference.
    Uses a custom trained .keras model with sliding window temporal analysis.
    
    Key improvements:
    - Continuously analyzes full video stream (not just first frames)
    - Suspicious activities override normal activities dynamically
    - Only outputs stable predictions after sufficient temporal analysis
    - Priority-based class replacement (Shooting > Robbery > Fighting > Assault > Walking)
    """
    # Define classes exactly as they appear in the dataset
    CLASSES = [
        # Normal (LOW PRIORITY - do not permanently lock)
        "Clapping", "Meeting and Splitting", "Sitting", "Standing Still", 
        "Walking", "Walking while Reading a Book", "Walking while Using Phone",
        # Suspicious / Criminal (HIGH PRIORITY - will override normal)
        "Abuse", "Arrest", "Arson", "Assault", "Burglary", "Explosion", 
        "Fighting", "Road Accidents", "Robbery", "Shooting", "Shoplifting", 
        "Stealing", "Vandalism"
    ]
    
    # Map classes to threat levels
    THREAT_MAPPING = {
        # Critical threats
        "Shooting": "critical",
        "Explosion": "critical",
        "Arson": "critical",
        # High threats
        "Assault": "high",
        "Fighting": "high",
        "Robbery": "high",
        "Burglary": "high",
        "Abuse": "high",
        # Medium threats
        "Shoplifting": "medium",
        "Stealing": "medium",
        "Vandalism": "medium",
        "Road Accidents": "medium",
        "Arrest": "medium",
        # Normal
        "Clapping": "low",
        "Meeting and Splitting": "low",
        "Sitting": "low",
        "Standing Still": "low",
        "Walking": "low",
        "Walking while Reading a Book": "low",
        "Walking while Using Phone": "low"
    }

    def __init__(self, sequence_length: int = 16, frame_size: tuple = (224, 224), 
                 channels: int = 3, confidence_threshold: float = 0.6):
        self.sequence_length = sequence_length
        self.frame_size = frame_size
        self.channels = channels
        self.confidence_threshold = confidence_threshold
        
        self.model_key = "activity/custom_model" # Default name
        self.is_ready = False
        
        # TEMPORAL INFERENCE ENGINE
        # This replaces simple smoothing with intelligent temporal analysis
        self.temporal_engine = TemporalInferenceEngine(
            window_size=24,  # Analyze 24 frames (sliding window)
            min_stable_frames=12,  # Need 12 frames before stable prediction
            temporal_smoothing_factor=0.4,
            confidence_decay=0.95,
            suspicion_boost=1.3,
            min_confidence_threshold=confidence_threshold
        )
        
        # For backward compatibility - will be updated by temporal engine
        self.last_stable_activity = "Analyzing..."
        self.last_stable_confidence = 0.0
        
        self._try_load_model()
        
    def _try_load_model(self):
        """Attempts to load the .keras model if available."""
        try:
            discovered = model_loader.discover_models()
            
            # Find the first activity model
            activity_models = [k for k in discovered.keys() if k.startswith("activity/")]
            
            if activity_models:
                self.model_key = activity_models[0]
                self.model_info = model_loader.get_model(self.model_key)
                
                # Auto-adapt to model's expected shape if possible
                if self.model_info.input_shape:
                    shape = self.model_info.input_shape
                    # Expected shape: (frames, height, width, channels)
                    if len(shape) == 4:
                        self.sequence_length = shape[0]
                        self.frame_size = (shape[2], shape[1]) # OpenCV uses (width, height)
                        self.channels = shape[3]
                        logger.info(f"Adapted ActivityDetector to model shape: {shape}")
                
                self.is_ready = True
                logger.info(f"✅ Activity model '{self.model_key}' is ready.")
            else:
                logger.warning("No activity model found. Activity recognition is disabled until a model is provided.")
        except Exception as e:
            logger.error(f"Failed to load activity model: {e}")

    def analyze_sequence(self, sequence_batch: np.ndarray) -> Dict:
        """
        Runs inference on a prepared batch of frames with temporal analysis.
        
        Uses sliding window temporal inference to:
        1. Continuously monitor activity changes over time
        2. Allow suspicious activities to override normal ones dynamically
        3. Only output stable predictions after sufficient temporal analysis
        
        sequence_batch shape: (1, sequence_length, height, width, channels)
        """
        import time
        
        if not self.is_ready:
            # Model not provided yet, returning neutral response
            return {
                "activity": "analyzing",
                "confidence": 0.0,
                "threat_level": "low",
                "is_suspicious": False,
                "is_stable": False,
                "message": "Model loading..."
            }
            
        try:
            # Add debug logs for sequence shape
            logger.info(f"Model Input Sequence Shape: {sequence_batch.shape}")
            
            # Run inference using the Keras model
            predictions = self.model_info.model_object.predict(sequence_batch, verbose=0)
            
            # Extract raw probability vector
            raw_probs = predictions[0]
            
            # Format raw predictions nicely for debugging
            raw_pred_dict = {self.CLASSES[i]: float(raw_probs[i]) for i in range(min(len(self.CLASSES), len(raw_probs)))}
            logger.info(f"RAW PREDICTION VECTOR:\n{raw_pred_dict}")
            
            # TEMPORAL INFERENCE: Update sliding window analysis
            temporal_result = self.temporal_engine.update(
                raw_probs=raw_probs,
                class_names=self.CLASSES,
                timestamp=time.time()
            )
            
            # Get the temporally-analyzed prediction
            activity_label = temporal_result["activity"]
            confidence = temporal_result["confidence"]
            threat_level = temporal_result["threat_level"]
            is_suspicious = temporal_result["is_suspicious"]
            is_stable = temporal_result["is_stable"]
            frames_analyzed = temporal_result["frames_analyzed"]
            
            # If not stable yet, show analyzing status (don't lock to early normal activity)
            if not is_stable and not is_suspicious:
                # Show best suspicious if we have one, even if not fully stable
                if temporal_result.get("best_suspicious") and temporal_result.get("best_suspicious_confidence", 0) > 0.3:
                    activity_label = temporal_result["best_suspicious"]
                    confidence = temporal_result["best_suspicious_confidence"]
                    threat_level = self.THREAT_MAPPING.get(activity_label, "medium")
                    is_suspicious = True
                    logger.info(f"Using best suspicious activity (not yet stable): {activity_label}")
                else:
                    # Not enough data yet - show analyzing
                    activity_label = "analyzing"
                    confidence = 0.0
                    threat_level = "low"
                    is_suspicious = False
            
            # Update legacy tracking for compatibility
            self.last_stable_activity = activity_label
            self.last_stable_confidence = confidence
            
            logger.info(
                f"TEMPORAL INFERENCE: {activity_label} "
                f"(confidence: {confidence:.2f}, stable: {is_stable}, "
                f"frames: {frames_analyzed})"
            )
            
            # Build comprehensive result
            result = {
                "activity": activity_label,
                "confidence": confidence,
                "threat_level": threat_level,
                "is_suspicious": is_suspicious,
                "is_stable": is_stable,
                "frames_analyzed": frames_analyzed,
                "best_suspicious": temporal_result.get("best_suspicious"),
                "best_suspicious_confidence": temporal_result.get("best_suspicious_confidence"),
            }
            
            # Add debugging info
            if "class_confidences" in temporal_result:
                result["class_confidences"] = temporal_result["class_confidences"]
            
            return result
            
        except Exception as e:
            logger.error(f"Error during sequence inference: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "activity": "error",
                "confidence": 0.0,
                "threat_level": "low",
                "is_suspicious": False,
                "is_stable": False,
                "message": str(e)
            }
    
    def reset_temporal_state(self):
        """Reset the temporal inference engine (e.g., for new video)"""
        self.temporal_engine.reset()
        self.last_stable_activity = "analyzing"
        self.last_stable_confidence = 0.0
        logger.info("Temporal inference state reset for new video stream")
