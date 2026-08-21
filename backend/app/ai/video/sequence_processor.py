import collections
import cv2
import numpy as np
from typing import Tuple

class VideoSequenceBuffer:
    """
    Buffers frames to form sequences for video-based activity recognition models.
    Supports configurable sequence lengths and spatial resolutions.
    """
    def __init__(self, sequence_length: int = 16, frame_size: Tuple[int, int] = (224, 224), channels: int = 3):
        self.sequence_length = sequence_length
        self.frame_size = frame_size
        self.channels = channels
        self.buffer = collections.deque(maxlen=sequence_length)
    
    def add_frame(self, frame: np.ndarray):
        """Preprocesses and adds a single frame to the buffer."""
        # Resize to model expected input size
        processed_frame = cv2.resize(frame, self.frame_size)
        
        # Ensure correct channel count and colorspace (Keras expects RGB, OpenCV uses BGR)
        if self.channels == 3 and len(processed_frame.shape) == 3:
            processed_frame = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2RGB)
        elif self.channels == 3 and len(processed_frame.shape) == 2:
            processed_frame = cv2.cvtColor(processed_frame, cv2.COLOR_GRAY2RGB)
        elif self.channels == 1 and len(processed_frame.shape) == 3:
            processed_frame = cv2.cvtColor(processed_frame, cv2.COLOR_BGR2GRAY)
            
        # Normalize to [0, 1] as standard for Keras models
        processed_frame = processed_frame.astype(np.float32) / 255.0
        
        # Add channel dimension if grayscale
        if self.channels == 1 and len(processed_frame.shape) == 2:
            processed_frame = np.expand_dims(processed_frame, axis=-1)
            
        self.buffer.append(processed_frame)
        
    def is_ready(self) -> bool:
        """Returns True if the buffer has collected enough frames for a sequence."""
        return len(self.buffer) == self.sequence_length
        
    def get_sequence(self) -> np.ndarray:
        """
        Returns the buffered sequence as a batched NumPy array.
        Shape: (1, sequence_length, height, width, channels)
        """
        if not self.is_ready():
            raise ValueError("Buffer is not full yet.")
        
        # Stack frames along the time dimension
        sequence = np.stack(self.buffer, axis=0)
        
        # Add batch dimension (Batch size = 1)
        return np.expand_dims(sequence, axis=0)
        
    def clear(self):
        """Clears the buffer."""
        self.buffer.clear()
