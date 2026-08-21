# AI Surveillance Platform - Backend

A production-ready AI-powered real-time surveillance and threat detection system backend.

## 🚀 Features

### Real-Time Video Processing
- **Webcam Support** - Process live webcam feeds
- **CCTV/RTSP Streams** - Connect to IP cameras and DVRs
- **Video Files** - Process uploaded video files
- **Multiple Streams** - Handle multiple simultaneous camera feeds

### AI Detection Modules
- ✅ **Human Detection** - YOLO-based person detection with tracking
- ✅ **Weapon Detection** - Gun, knife, rifle detection
- ✅ **Fire & Smoke Detection** - Fire hazard detection with segmentation
- ✅ **Violence Detection** - Fighting and aggressive behavior detection (CNN+LSTM)
- ✅ **Fall Detection** - Person fall detection using pose estimation
- ✅ **Crowd Analysis** - Crowd density and panic detection
- ✅ **Activity Analysis** - Loitering, running, suspicious behavior
- ✅ **Pose Estimation** - MediaPipe-based skeleton detection
- ✅ **Person Tracking** - DeepSORT multi-object tracking

### AI Model Support
Supported model formats:
- `.pt` / `.pth` - PyTorch models (YOLO, custom)
- `.onnx` - ONNX optimized models
- `.engine` - TensorRT engines (GPU optimized)
- `.h5` - TensorFlow/Keras models
- SavedModel - TensorFlow SavedModel format

### Real-Time Streaming
- WebSocket streaming to frontend
- Base64 encoded JPEG frames
- Detection overlays (bounding boxes, labels)
- Threat level indicators
- Alert notifications

### Alert System
- **Severity Levels**: Low, Medium, High, Critical
- **Alert Types**: Weapon, Fire, Violence, Fall, Intrusion, Crowd
- **Cooldown System** - Prevents alert spam
- **Snapshots** - Auto-saves incident images
- **WebSocket Alerts** - Real-time frontend notifications

### Database (PostgreSQL)
- Users & Authentication
- Camera configurations
- Detection events
- Incidents & Alerts
- AI Model registry
- Zone definitions
- Tracking history
- Analytics data

## 📁 Project Structure

```
backend/
├── app/
│   ├── ai/
│   │   ├── detectors/          # Detection modules
│   │   │   ├── base_detector.py
│   │   │   ├── human_detector.py
│   │   │   ├── weapon_detector.py
│   │   │   ├── fire_detector.py
│   │   │   └── violence_detector.py
│   │   ├── trackers/           # Tracking modules
│   │   │   └── deepsort_tracker.py
│   │   ├── pose/               # Pose estimation
│   │   │   └── pose_estimator.py
│   │   └── model_loader.py     # Universal model loader
│   ├── video/
│   │   └── stream_processor.py # Video processing engine
│   ├── websocket/
│   │   └── manager.py          # WebSocket streaming
│   ├── alerts/
│   │   └── engine.py           # Alert management
│   ├── database/
│   │   └── models.py           # SQLAlchemy models
│   ├── api/
│   │   └── v1/
│   │       ├── api.py          # API router
│   │       └── endpoints/      # API endpoints
│   │           ├── streams.py
│   │           ├── models.py
│   │           └── ...
│   ├── core/
│   │   └── config.py           # Configuration
│   └── main.py                 # FastAPI app
├── models/                     # AI model storage
│   ├── human/
│   ├── weapon/
│   ├── fire/
│   └── violence/
├── requirements.txt
└── Dockerfile
```

## 🛠️ Installation

### Prerequisites
- Python 3.11+
- CUDA-capable GPU (optional but recommended)
- PostgreSQL 14+
- Redis 6+

### Setup

1. **Create virtual environment**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Initialize database**
```bash
python -c "from app.database.models import init_db; init_db()"
```

5. **Run the server**
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Application
DEBUG=false
ENVIRONMENT=production
SECRET_KEY=your-secret-key-here

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ai_surveillance

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AI Models
MODEL_PATH=./models
DEFAULT_CONFIDENCE=0.5
YOLO_DEVICE=auto  # auto, cpu, cuda

# Notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
TELEGRAM_BOT_TOKEN=your-bot-token
TWILIO_ACCOUNT_SID=your-account-sid
```

## 🚀 API Usage

### Start a Stream

**Webcam:**
```bash
curl -X POST "http://localhost:8000/api/v1/streams/start" \
  -H "Content-Type: application/json" \
  -d '{
    "stream_id": "cam_001",
    "source": "0",
    "source_type": "webcam",
    "enable_weapon_detection": true,
    "enable_fire_detection": true,
    "target_fps": 15
  }'
```

**RTSP Stream:**
```bash
curl -X POST "http://localhost:8000/api/v1/streams/start" \
  -H "Content-Type: application/json" \
  -d '{
    "stream_id": "cctv_001",
    "source": "rtsp://user:pass@camera-ip:554/stream",
    "source_type": "rtsp",
    "enable_violence_detection": true,
    "enable_fall_detection": true
  }'
```

### Upload Model

```bash
curl -X POST "http://localhost:8000/api/v1/models/upload" \
  -F "file=@weapon_detector.pt" \
  -F "category=weapon" \
  -F "model_name=gun_detector" \
  -F "description=Custom weapon detection model" \
  -F "class_names=gun,knife,rifle" \
  -F "set_as_default=true"
```

### List Active Streams

```bash
curl "http://localhost:8000/api/v1/streams/list"
```

### WebSocket Connection

```javascript
// Browser/Frontend
const ws = new WebSocket('ws://localhost:8000/api/v1/streams/ws/cam_001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'frame') {
    // Display frame
    const img = document.createElement('img');
    img.src = 'data:image/jpeg;base64,' + data.frame;
    document.body.appendChild(img);
    
    // Show detections
    console.log('Detections:', data.detections);
    console.log('Threat Level:', data.threat_level);
  }
  
  if (data.type === 'alert') {
    // Handle alert
    alert(`CRITICAL: ${data.alert.message}`);
  }
};
```

## 🎯 Model Format Support

### Adding Your Models

1. **Place model in appropriate folder:**
```
models/
├── human/yolov8n.pt          # Human detection
├── weapon/gun_detector.pt    # Weapon detection
├── fire/fire_smoke.onnx      # Fire detection
└── violence/violence.h5      # Violence detection
```

2. **Models are auto-discovered on startup**

3. **Load dynamically via API:**
```bash
POST /api/v1/models/load/weapon/gun_detector
```

### Model Requirements

**YOLO Models:**
- Must be YOLOv8, YOLOv10, or YOLOv11 format
- Standard COCO classes or custom classes
- `.pt` or `.onnx` format

**Custom Violence/Activity Models:**
- Input shape: (16, 224, 224, 3) for temporal models
- Output: [normal_prob, violence_prob]
- Formats: `.h5`, `.pt`, `.onnx`

## 🐳 Docker Deployment

### With GPU Support

```bash
docker-compose up -d
```

Services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **WebSocket**: ws://localhost:8000/api/v1/streams/ws/{stream_id}
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### GPU Requirements
- NVIDIA Docker runtime
- CUDA 11.8+
- cuDNN 8.6+

## 📊 Performance Optimization

### Frame Skipping
```python
config = ProcessingConfig(
    frame_skip=2,  # Process every 3rd frame
    target_fps=15
)
```

### Batch Inference
For video files, process at full speed:
```python
config = ProcessingConfig(
    target_fps=30,
    frame_skip=0
)
```

### GPU Acceleration
```python
# Auto-detect GPU
YOLO_DEVICE=auto

# Force GPU
YOLO_DEVICE=cuda

# Multi-GPU
YOLO_DEVICE=0,1
```

### TensorRT (NVIDIA)
Convert models for faster inference:
```bash
yolo export model=yolov8n.pt format=engine device=0
```

## 🚨 Alert Configuration

### Severity Levels
- **LOW**: Info only, no notification
- **MEDIUM**: Dashboard notification
- **HIGH**: Email + Dashboard notification
- **CRITICAL**: Email + SMS + Telegram + Dashboard

### Cooldown Settings
```python
# Default cooldowns (minutes)
WEAPON_COOLDOWN = 5
FIRE_COOLDOWN = 3
VIOLENCE_COOLDOWN = 5
FALL_COOLDOWN = 10
```

## 🔌 Integration Examples

### Webhook Notifications
```python
alert_engine.register_notification_callback(
    lambda incident: requests.post(
        "https://your-webhook.com/alerts",
        json={"incident": incident.id, "type": incident.incident_type}
    )
)
```

### Custom Detector
```python
from app.ai.detectors.base_detector import BaseDetector

class CustomDetector(BaseDetector):
    def detect(self, frame):
        # Your detection logic
        return DetectionResult(...)
```

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### Prometheus Metrics
Available at `/metrics`:
- `detection_count_total`
- `alert_count_total`
- `stream_fps`
- `inference_duration_seconds`

## 🔒 Security

- JWT authentication required for all endpoints
- Role-based access control (Admin, Operator, Viewer)
- Secure WebSocket with token validation
- API rate limiting
- SQL injection protection via SQLAlchemy

## 🐛 Troubleshooting

### CUDA Out of Memory
```bash
# Reduce batch size or use CPU
YOLO_DEVICE=cpu
```

### RTSP Connection Issues
```bash
# Check stream URL
ffprobe rtsp://user:pass@camera-ip:554/stream
```

### Model Not Loading
```bash
# Check model path
python -c "from app.ai.model_loader import model_loader; print(model_loader.discover_models())"
```

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📞 Support

For issues and feature requests, please use GitHub Issues.

---

**⚠️ IMPORTANT**: This system is designed for legitimate security and surveillance purposes. Ensure compliance with local privacy laws and regulations.
