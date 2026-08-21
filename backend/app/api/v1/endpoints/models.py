"""
AI Model Management API Endpoints (No Database)
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Dict, Optional
import os
import shutil
import logging
from pathlib import Path

from app.ai.model_loader import model_loader, ModelFormat

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/list")
async def list_models() -> Dict:
    """
    List all available AI models organized by category
    
    Returns models organized by category (human, weapon, fire, violence, etc.)
    """
    models = model_loader.list_available_models()
    
    return {
        "success": True,
        "models": models,
        "count": sum(len(m) for m in models.values())
    }


@router.get("/info/{category}/{model_name}")
async def get_model_info(category: str, model_name: str):
    """Get detailed information about a specific model"""
    model_key = f"{category}/{model_name}"
    
    try:
        info = model_loader.get_model(model_key)
        
        return {
            "success": True,
            "model": {
                "name": info.name,
                "category": info.category,
                "format": info.format.value,
                "path": info.path,
                "input_shape": info.input_shape,
                "loaded": info.loaded,
                "device": info.device
            }
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Model not found: {str(e)}")


@router.post("/load/{category}/{model_name}")
async def load_model(
    category: str,
    model_name: str,
    device: str = "auto"
):
    """
    Load a model into memory
    
    Args:
        category: Model category (human, weapon, fire, etc.)
        model_name: Name of the model file
        device: Device to load on (auto, cpu, cuda, 0, 1, etc.)
    """
    model_key = f"{category}/{model_name}"
    
    try:
        info = model_loader.load_model(model_key, device)
        
        return {
            "success": True,
            "message": f"Model {model_key} loaded successfully",
            "model": {
                "name": info.name,
                "format": info.format.value,
                "device": info.device,
                "loaded": info.loaded
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load model: {str(e)}")


@router.post("/unload/{category}/{model_name}")
async def unload_model(category: str, model_name: str):
    """Unload a model to free memory"""
    model_key = f"{category}/{model_name}"
    
    model_loader.unload_model(model_key)
    
    return {
        "success": True,
        "message": f"Model {model_key} unloaded"
    }


@router.post("/upload")
async def upload_model(
    file: UploadFile = File(...),
    category: str = Form(...),
    custom_name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    class_names: Optional[str] = Form(None),
    set_as_default: bool = Form(False)
):
    """
    Upload a new AI model
    
    Args:
        file: Model file (.pt, .pth, .onnx, .h5, .engine)
        category: Model category (human, weapon, fire, violence, activity)
        custom_name: Custom name for the model (optional)
        description: Model description
        class_names: Comma-separated list of class names
        set_as_default: Whether to set as default for category
    """
    # Validate file extension
    allowed_extensions = ['.pt', '.pth', '.onnx', '.engine', '.h5']
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Create category directory
    category_dir = Path(model_loader.models_root) / category
    category_dir.mkdir(parents=True, exist_ok=True)
    
    # Determine filename
    if custom_name:
        filename = f"{custom_name}{file_ext}"
    else:
        filename = file.filename
    
    file_path = category_dir / filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Parse class names
    classes = []
    if class_names:
        classes = [c.strip() for c in class_names.split(",")]
    
    # Return success (no database storage)
    return {
        "success": True,
        "message": "Model uploaded successfully",
        "model": {
            "name": Path(filename).stem,
            "category": category,
            "path": str(file_path),
            "is_default": set_as_default
        }
    }


@router.delete("/{category}/{model_name}")
async def delete_model(category: str, model_name: str):
    """Delete a model"""
    model_key = f"{category}/{model_name}"
    
    # Unload if loaded
    if model_key in model_loader.loaded_models:
        model_loader.unload_model(model_key)
    
    # Find file
    model_path = Path(model_loader.models_root) / category / f"{model_name}.pt"
    if not model_path.exists():
        # Try other extensions
        for ext in ['.pth', '.onnx', '.engine', '.h5']:
            alt_path = model_path.with_suffix(ext)
            if alt_path.exists():
                model_path = alt_path
                break
    
    if not model_path.exists():
        raise HTTPException(status_code=404, detail="Model file not found")
    
    # Delete file
    try:
        model_path.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
    
    # No database to clean up
    
    return {
        "success": True,
        "message": f"Model {model_key} deleted"
    }


@router.get("/formats")
async def get_supported_formats():
    """Get list of supported model formats"""
    return {
        "formats": [
            {
                "extension": ".pt",
                "name": "PyTorch Model",
                "description": "YOLO models, custom PyTorch models"
            },
            {
                "extension": ".pth",
                "name": "PyTorch State Dict",
                "description": "PyTorch state dictionaries"
            },
            {
                "extension": ".onnx",
                "name": "ONNX",
                "description": "Cross-platform optimized models"
            },
            {
                "extension": ".engine",
                "name": "TensorRT Engine",
                "description": "NVIDIA GPU optimized models"
            },
            {
                "extension": ".h5",
                "name": "Keras/TensorFlow",
                "description": "TensorFlow SavedModel format"
            }
        ]
    }
