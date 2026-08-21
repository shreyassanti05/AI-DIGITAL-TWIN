"""
Alert Engine
Manages alert rules, triggers, and incident tracking.
"""
import asyncio
import logging
import os
import time
import uuid
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from collections import defaultdict
from enum import Enum

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    """Alert severity levels with numeric ordering"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class AlertRule:
    """Defines when to trigger an alert"""
    rule_id: str
    name: str
    description: str
    detection_type: str  # weapon, fire, violence, crowd, intrusion, fall
    severity_threshold: AlertSeverity = AlertSeverity.MEDIUM
    confidence_threshold: float = 0.6
    cooldown_seconds: int = 60
    enabled: bool = True


@dataclass
class Incident:
    """Recorded incident"""
    incident_id: str
    stream_id: str
    timestamp: float
    alert_type: str
    severity: AlertSeverity
    message: str
    confidence: float = 0.0
    snapshot_path: Optional[str] = None
    resolved: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


class AlertEngine:
    """
    Alert processing engine.
    Evaluates detections against rules and generates incidents.
    """

    def __init__(self):
        self.rules: List[AlertRule] = self._default_rules()
        self.incidents: List[Incident] = []
        self.last_alert_time: Dict[str, float] = {}
        self.max_incidents = 1000
        self.snapshot_dir = "snapshots"
        os.makedirs(self.snapshot_dir, exist_ok=True)

    @staticmethod
    def _default_rules() -> List[AlertRule]:
        return [
            AlertRule(
                rule_id="weapon_alert",
                name="Weapon Detection",
                description="Alert when weapon detected",
                detection_type="weapon",
                severity_threshold=AlertSeverity.CRITICAL,
                confidence_threshold=0.6,
                cooldown_seconds=30,
            ),
            AlertRule(
                rule_id="fire_alert",
                name="Fire/Smoke Detection",
                description="Alert when fire or smoke detected",
                detection_type="fire",
                severity_threshold=AlertSeverity.CRITICAL,
                confidence_threshold=0.5,
                cooldown_seconds=30,
            ),
            AlertRule(
                rule_id="violence_alert",
                name="Violence Detection",
                description="Alert when violent activity detected",
                detection_type="violence",
                severity_threshold=AlertSeverity.HIGH,
                confidence_threshold=0.7,
                cooldown_seconds=60,
            ),
            AlertRule(
                rule_id="crowd_alert",
                name="Crowd Alert",
                description="Alert when dangerous crowd density detected",
                detection_type="crowd",
                severity_threshold=AlertSeverity.HIGH,
                confidence_threshold=0.5,
                cooldown_seconds=120,
            ),
            AlertRule(
                rule_id="fall_alert",
                name="Fall Detection",
                description="Alert when person fall detected",
                detection_type="fall",
                severity_threshold=AlertSeverity.MEDIUM,
                confidence_threshold=0.6,
                cooldown_seconds=60,
            ),
            AlertRule(
                rule_id="loitering_alert",
                name="Loitering Detection",
                description="Alert when suspicious loitering detected",
                detection_type="loitering",
                severity_threshold=AlertSeverity.LOW,
                confidence_threshold=0.5,
                cooldown_seconds=120,
            ),
            AlertRule(
                rule_id="activity_alert",
                name="Suspicious Activity",
                description="Alert when dataset-driven suspicious activity is detected",
                detection_type="activity",
                severity_threshold=AlertSeverity.MEDIUM,
                confidence_threshold=0.6,
                cooldown_seconds=30,
            ),
        ]

    async def process_detection(self, stream_id: str, alert_data: Dict, frame: Optional[np.ndarray] = None):
        """Process a detection alert against rules"""
        alert_type = alert_data.get("type", "")
        alert_level = alert_data.get("level", "low")
        confidence = alert_data.get("confidence", 0.5)
        message = alert_data.get("message", "")

        # Map string level to enum
        severity = self._level_to_severity(alert_level)

        # Check matching rules
        for rule in self.rules:
            if not rule.enabled:
                continue
            if rule.detection_type != alert_type:
                continue

            # Check confidence threshold
            if confidence < rule.confidence_threshold:
                continue

            # Check severity (numeric comparison)
            if severity.value < rule.severity_threshold.value:
                continue

            # Check cooldown
            cooldown_key = f"{stream_id}:{rule.rule_id}"
            last_time = self.last_alert_time.get(cooldown_key, 0)
            if time.time() - last_time < rule.cooldown_seconds:
                continue

            # Generate incident
            snapshot_path = None
            if frame is not None:
                snapshot_path = self._save_snapshot(stream_id, frame)

            incident = Incident(
                incident_id=str(uuid.uuid4())[:8],
                stream_id=stream_id,
                timestamp=time.time(),
                alert_type=alert_type,
                severity=severity,
                message=message,
                confidence=confidence,
                snapshot_path=snapshot_path,
                metadata=alert_data,
            )

            self.incidents.append(incident)
            self.last_alert_time[cooldown_key] = time.time()

            # Trim old incidents
            if len(self.incidents) > self.max_incidents:
                self.incidents = self.incidents[-self.max_incidents:]

            logger.warning(
                f"🚨 ALERT [{severity.name}] Stream {stream_id}: "
                f"{message} (conf: {confidence:.0%})"
            )

    @staticmethod
    def _level_to_severity(level: str) -> AlertSeverity:
        mapping = {
            "critical": AlertSeverity.CRITICAL,
            "high": AlertSeverity.HIGH,
            "medium": AlertSeverity.MEDIUM,
            "low": AlertSeverity.LOW,
        }
        return mapping.get(level.lower(), AlertSeverity.LOW)

    def _save_snapshot(self, stream_id: str, frame: np.ndarray) -> Optional[str]:
        """Save frame snapshot for incident evidence"""
        try:
            filename = f"{stream_id}_{int(time.time())}_{uuid.uuid4().hex[:6]}.jpg"
            path = os.path.join(self.snapshot_dir, filename)
            cv2.imwrite(path, frame)
            return path
        except Exception as e:
            logger.error(f"Failed to save snapshot: {e}")
            return None

    def get_incidents(self, stream_id: Optional[str] = None,
                     severity: Optional[str] = None,
                     limit: int = 50) -> List[Dict]:
        """Get recent incidents"""
        incidents = self.incidents

        if stream_id:
            incidents = [i for i in incidents if i.stream_id == stream_id]

        if severity:
            sev = self._level_to_severity(severity)
            incidents = [i for i in incidents if i.severity.value >= sev.value]

        # Return newest first
        incidents = sorted(incidents, key=lambda i: i.timestamp, reverse=True)[:limit]

        return [
            {
                "incident_id": i.incident_id,
                "stream_id": i.stream_id,
                "timestamp": i.timestamp,
                "alert_type": i.alert_type,
                "severity": i.severity.name.lower(),
                "message": i.message,
                "confidence": i.confidence,
                "snapshot": i.snapshot_path,
                "resolved": i.resolved,
            }
            for i in incidents
        ]

    def clear_incidents(self):
        """Clear all incidents"""
        self.incidents.clear()
        self.last_alert_time.clear()


# Global instance
alert_engine = AlertEngine()
