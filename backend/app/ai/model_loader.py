"""
AI Model Loader System
Supports: .pt, .pth, .onnx, .engine, .h5, SavedModel
All heavy imports are lazy to avoid crashes when optional deps aren't installed.
"""
import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class ModelFormat(Enum):
    """Supported model formats"""
    PYTORCH = ".pt"
    PYTORCH_STATE = ".pth"
    ONNX = ".onnx"
    TENSORRT = ".engine"
    TENSORFLOW_H5 = ".h5"
    TENSORFLOW_SAVED = "savedmodel"
    ULTRALYTICS = "ultralytics"


@dataclass
class ModelInfo:
    """Model metadata"""
    name: str
    path: str
    format: ModelFormat
    category: str  # human, weapon, fire, violence, activity
    input_shape: tuple = (640, 640, 3)
    output_shape: tuple = ()
    class_names: list = field(default_factory=list)
    confidence_threshold: float = 0.5
    device: str = "auto"
    loaded: bool = False
    model_object: Optional[Any] = None


class ModelLoader:
    """
    Universal AI Model Loader
    Automatically detects and loads models in various formats.
    All framework imports are lazy to avoid import-time crashes.
    """

    def __init__(self, models_root: str = "./models"):
        self.models_root = Path(models_root)
        self.loaded_models: Dict[str, ModelInfo] = {}
        self._initialize_directories()

    def _initialize_directories(self):
        """Create model directories if they don't exist"""
        categories = ["human", "weapon", "fire", "violence", "activity", "pose", "custom"]
        for cat in categories:
            (self.models_root / cat).mkdir(parents=True, exist_ok=True)

    def discover_models(self) -> Dict[str, ModelInfo]:
        """Auto-discover all models in the models directory"""
        discovered = {}

        if not self.models_root.exists():
            return discovered

        for category_dir in self.models_root.iterdir():
            if not category_dir.is_dir():
                continue

            category = category_dir.name

            for model_file in category_dir.iterdir():
                if model_file.is_file():
                    fmt = self._detect_format(model_file.suffix)
                    if fmt:
                        model_name = model_file.stem
                        info = ModelInfo(
                            name=model_name,
                            path=str(model_file),
                            format=fmt,
                            category=category,
                        )
                        discovered[f"{category}/{model_name}"] = info

        return discovered

    def _detect_format(self, suffix: str) -> Optional[ModelFormat]:
        """Detect model format from file extension"""
        format_map = {
            ".pt": ModelFormat.PYTORCH,
            ".pth": ModelFormat.PYTORCH_STATE,
            ".onnx": ModelFormat.ONNX,
            ".engine": ModelFormat.TENSORRT,
            ".h5": ModelFormat.TENSORFLOW_H5,
            ".keras": ModelFormat.TENSORFLOW_H5,
        }
        return format_map.get(suffix.lower())

    def _get_device(self, device: str) -> str:
        """Determine best device string"""
        if device == "auto":
            try:
                import torch
                if torch.cuda.is_available():
                    return "cuda"
                elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                    return "mps"
            except ImportError:
                pass
            return "cpu"
        return device

    def load_model(self, model_key: str, device: str = "auto") -> ModelInfo:
        """
        Load a model by key (category/name).
        Returns ModelInfo with loaded model.
        Raises ValueError if model not found.
        """
        if model_key in self.loaded_models:
            return self.loaded_models[model_key]

        discovered = self.discover_models()
        if model_key not in discovered:
            raise ValueError(f"Model '{model_key}' not found in {self.models_root}")

        info = discovered[model_key]
        info.device = self._get_device(device)

        try:
            if info.format in [ModelFormat.PYTORCH, ModelFormat.ULTRALYTICS]:
                info.model_object = self._load_yolo(info)
            elif info.format == ModelFormat.ONNX:
                info.model_object = self._load_onnx(info)
            elif info.format == ModelFormat.TENSORFLOW_H5:
                info.model_object = self._load_tensorflow(info)
            elif info.format == ModelFormat.TENSORRT:
                info.model_object = self._load_tensorrt(info)
            else:
                raise ValueError(f"Unsupported format: {info.format}")

            info.loaded = True
            self.loaded_models[model_key] = info
            logger.info(f"✅ Loaded model '{model_key}' on {info.device}")
        except Exception as e:
            logger.error(f"❌ Failed to load model '{model_key}': {e}")
            raise

        return info

    def _load_yolo(self, info: ModelInfo):
        """Load YOLO model (Ultralytics)"""
        from ultralytics import YOLO
        model = YOLO(info.path)
        if info.device != "cpu":
            try:
                model.to(info.device)
            except Exception:
                logger.warning(f"Cannot move model to {info.device}, using CPU")
                info.device = "cpu"
        return model

    def _load_onnx(self, info: ModelInfo):
        """Load ONNX model"""
        try:
            import onnxruntime as ort
        except ImportError:
            raise ImportError("onnxruntime is not installed. Install with: pip install onnxruntime")
        providers = (
            ["CUDAExecutionProvider", "CPUExecutionProvider"]
            if info.device == "cuda"
            else ["CPUExecutionProvider"]
        )
        session = ort.InferenceSession(info.path, providers=providers)
        return session

    def _load_tensorflow(self, info: ModelInfo):
        """Load TensorFlow/Keras model"""
        try:
            import tensorflow as tf
        except ImportError:
            raise ImportError("tensorflow is not installed. Install with: pip install tensorflow")
        model = tf.keras.models.load_model(info.path)
        
        # Try to automatically detect input shape from Keras model
        try:
            # Model inputs usually have shape like (None, frames, height, width, channels)
            # or (None, height, width, channels)
            input_shape = model.input_shape
            if input_shape:
                # Store the shape without the batch dimension (None)
                info.input_shape = input_shape[1:]
                logger.info(f"Auto-detected model input shape: {info.input_shape}")
        except Exception as e:
            logger.warning(f"Could not automatically detect input shape for {info.path}: {e}")
            
        return model

    def _load_tensorrt(self, info: ModelInfo):
        """Load TensorRT engine"""
        try:
            import tensorrt as trt
        except ImportError:
            raise ImportError("tensorrt is not installed. Install NVIDIA TensorRT.")
        logger.info(f"Loading TensorRT engine: {info.path}")
        trt_logger = trt.Logger(trt.Logger.WARNING)
        runtime = trt.Runtime(trt_logger)
        with open(info.path, "rb") as f:
            engine = runtime.deserialize_cuda_engine(f.read())
        return engine

    def get_model(self, model_key: str) -> ModelInfo:
        """Get loaded model, loading if necessary"""
        if model_key not in self.loaded_models:
            return self.load_model(model_key)
        return self.loaded_models[model_key]

    def unload_model(self, model_key: str):
        """Unload a model to free memory"""
        if model_key in self.loaded_models:
            info = self.loaded_models[model_key]
            try:
                import torch
                import gc
                del info.model_object
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            except ImportError:
                del info.model_object
            info.loaded = False
            info.model_object = None
            del self.loaded_models[model_key]
            logger.info(f"Unloaded model: {model_key}")

    def list_available_models(self) -> Dict[str, list]:
        """List all available models by category"""
        discovered = self.discover_models()
        by_category: Dict[str, list] = {}
        for key, info in discovered.items():
            cat = info.category
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append({
                "name": info.name,
                "format": info.format.value,
                "loaded": key in self.loaded_models,
            })
        return by_category


# Global model loader instance
model_loader = ModelLoader()
