'use client';

import { motion } from 'framer-motion';
import { 
  Camera, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Activity,
  Shield,
  Eye,
  WifiOff
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/use-websocket';
import { streamApi, type Stream } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { StreamStarter } from '@/components/StreamStarter';

const sidebarLinks = [
  { name: 'Live Monitor', href: '/monitor', icon: Eye, active: true },
  { name: 'Cameras', href: '/cameras', icon: Camera },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface DetectionAlert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  level: 'low' | 'medium' | 'high' | 'critical';
}

interface CameraFeedProps {
  stream: Stream;
  onAlert: (alert: DetectionAlert) => void;
}

function CameraFeed({ stream, onAlert }: CameraFeedProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [threatLevel, setThreatLevel] = useState('low');
  const [fps, setFps] = useState(0);
  const [detectionCount, setDetectionCount] = useState(0);

  const { isConnected } = useWebSocket({
    streamId: stream.stream_id,
    onFrame: (data) => {
      if (data.frame) {
        setImageSrc(`data:image/jpeg;base64,${data.frame}`);
        setThreatLevel(data.threat_level || 'low');
        setFps(data.fps || 0);
      }
    },
    onAlert: (data) => {
      if (data.alert) {
        onAlert({
          id: `${Date.now()}-${Math.random()}`,
          type: data.alert.type,
          message: data.alert.message,
          timestamp: new Date().toLocaleTimeString(),
          level: data.alert.level,
        });
      }
    },
    onDetectionUpdate: (data) => {
      if (data.detections) {
        setDetections(data.detections);
        setDetectionCount(data.stats?.human_count || 0);
      }
    },
  });

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="aspect-video glass-panel rounded-xl overflow-hidden relative group"
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={`Stream ${stream.stream_id}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-dark to-cyber-darker flex flex-col items-center justify-center">
          {isConnected ? (
            <>
              <Camera className="w-12 h-12 text-white/20 mb-2" />
              <span className="text-white/40 text-sm">Waiting for video...</span>
            </>
          ) : (
            <>
              <WifiOff className="w-12 h-12 text-cyber-red/40 mb-2" />
              <span className="text-cyber-red/60 text-sm">Disconnected</span>
            </>
          )}
        </div>
      )}

      <div className="absolute top-3 left-3 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyber-green animate-pulse' : 'bg-cyber-red'}`} />
        <span className="text-xs text-white/80 font-mono">
          {isConnected ? `${fps.toFixed(1)} FPS` : 'OFFLINE'}
        </span>
      </div>

      <div className="absolute top-3 right-3">
        <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${getThreatColor(threatLevel)} text-white`}>
          {threatLevel}
        </div>
      </div>

      {detectionCount > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <div className="px-3 py-1 rounded-full bg-cyber-blue/80 text-white text-xs font-bold">
            {detectionCount} {detectionCount === 1 ? 'PERSON' : 'PEOPLE'}
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">{stream.stream_id}</div>
              <div className="text-xs text-white/60">{stream.resolution} • {stream.source}</div>
            </div>
            <div className="flex items-center gap-2">
              {detections.slice(0, 3).map((det, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded text-xs ${
                    det.type === 'weapon' ? 'bg-red-500/80' :
                    det.type === 'fire' ? 'bg-orange-500/80' :
                    det.type === 'violence' ? 'bg-purple-500/80' :
                    'bg-green-500/80'
                  } text-white`}
                >
                  {det.type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-px bg-cyber-blue/30 animate-scan" />
      </div>
    </motion.div>
  );
}

function MonitorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [alerts, setAlerts] = useState<DetectionAlert[]>([]);
  const [stats, setStats] = useState({
    activeCameras: 0,
    totalDetections: 0,
    activeAlerts: 0,
    threatLevel: 'LOW' as 'LOW' | 'CRITICAL' | 'HIGH' | 'MEDIUM',
  });
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const searchParams = useSearchParams();
  const selectedStream = searchParams.get('stream');

  const handleAlert = useCallback((alert: DetectionAlert) => {
    setAlerts(prev => [alert, ...prev].slice(0, 50));
  }, []);

  // Fetch streams function
  const fetchStreams = useCallback(async () => {
    try {
      const streamsData = await streamApi.list();
      setStreams(streamsData);
      setIsBackendConnected(true);
      setStats({
        activeCameras: streamsData.length,
        totalDetections: streamsData.reduce((sum: number, s: Stream) => sum + s.frame_count, 0),
        activeAlerts: alerts.length,
        threatLevel: alerts.some(a => a.level === 'critical') ? 'CRITICAL' : 
                    alerts.some(a => a.level === 'high') ? 'HIGH' :
                    alerts.some(a => a.level === 'medium') ? 'MEDIUM' : 'LOW',
      });
    } catch (err) {
      console.error('Failed to fetch streams:', err);
      setIsBackendConnected(false);
    }
  }, [alerts]);

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 5000);
    return () => clearInterval(interval);
  }, [fetchStreams]);

  const displayedStreams = selectedStream 
    ? streams.filter(s => s.stream_id === selectedStream)
    : streams.slice(0, 8);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'cyber-red';
      case 'HIGH': return 'cyber-yellow';
      case 'MEDIUM': return 'cyber-blue';
      default: return 'cyber-green';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="glass-panel border border-white/10 px-8 py-4 rounded-xl flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">Live Monitor</h1>
        <div className="flex items-center gap-4">
          {!isBackendConnected && (
            <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-lg bg-cyber-red/10 border-cyber-red/30">
              <WifiOff className="w-4 h-4 text-cyber-red" />
              <span className="text-sm text-cyber-red">Backend Offline</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-lg">
            <Activity className={`w-4 h-4 ${isBackendConnected ? 'text-cyber-green animate-pulse' : 'text-white/40'}`} />
            <span className="text-sm text-white/80">
              {isBackendConnected ? 'System Online' : 'Connecting...'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-cyber-green' : 'bg-cyber-red'}`} />
            <span>{stats.activeCameras} Camera{stats.activeCameras !== 1 ? 's' : ''} Active</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Active Cameras', value: stats.activeCameras.toString(), icon: Camera, color: 'cyber-blue' },
              { label: 'Total Detections', value: stats.totalDetections.toLocaleString(), icon: Eye, color: 'cyber-green' },
              { label: 'Active Alerts', value: stats.activeAlerts.toString(), icon: AlertTriangle, color: alerts.some(a => a.level === 'critical' || a.level === 'high') ? 'cyber-red' : 'cyber-yellow' },
              { label: 'Threat Level', value: stats.threatLevel, icon: Shield, color: getThreatColor(stats.threatLevel) },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-${stat.color}/10 border border-${stat.color}/30 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Start Stream Section */}
          <StreamStarter onStreamStarted={fetchStreams} activeStreams={streams.map(s => s.stream_id)} />

          {/* Camera Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {selectedStream ? 'Live Stream' : 'Camera Feeds'}
              </h2>
              {selectedStream && (
                <Link href="/monitor">
                  <Button variant="outline" size="sm" className="border-white/20 text-white">
                    View All Cameras
                  </Button>
                </Link>
              )}
            </div>
            
            {displayedStreams.length === 0 ? (
              <div className="glass-panel rounded-xl p-12 text-center">
                <Camera className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Active Streams</h3>
                <p className="text-white/60 max-w-md mx-auto mb-4">
                  {isBackendConnected 
                    ? "Start a stream from the backend API to see live video feeds here."
                    : "Connect to the backend to start receiving live video streams."}
                </p>
                {isBackendConnected && (
                  <code className="bg-black/30 px-4 py-2 rounded text-sm text-cyber-blue">
                    POST /api/v1/streams/start
                  </code>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedStreams.map((stream) => (
                  <CameraFeed 
                    key={stream.stream_id} 
                    stream={stream} 
                    onAlert={handleAlert}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Alerts - REAL DETECTIONS */}
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Detections</h2>
              {alerts.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white/60"
                  onClick={() => setAlerts([])}
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No detections yet</p>
                  <p className="text-sm mt-1">Detection alerts will appear here in real-time</p>
                </div>
              ) : (
                alerts.slice(0, 10).map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 glass-panel rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.level === 'critical' ? 'bg-red-500 animate-pulse' :
                        alert.level === 'high' ? 'bg-orange-500' :
                        alert.level === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-white uppercase">{alert.type}</div>
                        <div className="text-xs text-white/60">{alert.message}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                        alert.level === 'critical' ? 'bg-red-500/20 text-red-400' :
                        alert.level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        alert.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {alert.level}
                      </span>
                      <div className="text-xs text-white/40 mt-1">{alert.timestamp}</div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
import { Suspense } from 'react';

export default function MonitorPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cyber-dark flex items-center justify-center"><span className="text-cyber-blue animate-pulse">Loading...</span></div>}>
      <MonitorPage />
    </Suspense>
  );
}
