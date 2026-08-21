'use client';

import { motion } from 'framer-motion';
import { Camera, Plus, Settings, Trash2, Play, Pause, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { streamApi, type Stream } from '@/lib/api';

interface CameraWithStatus extends Stream {
  name?: string;
  location?: string;
  zone?: string;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<CameraWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCameras = async () => {
    try {
      const data = await streamApi.list();
      setIsBackendConnected(true);
      setError(null);
      
      // Map streams to camera format
      const cameraList = data.map((stream: Stream, index: number) => ({
        ...stream,
        name: `Camera ${index + 1} (${stream.stream_id})`,
        location: stream.source === 'webcam' ? 'Local' : stream.source,
        zone: 'Zone A',
        status: stream.is_active ? 'online' : 'offline',
      }));
      
      setCameras(cameraList);
    } catch (err) {
      console.error('Backend not connected:', err);
      setIsBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStop = async (streamId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await streamApi.stop(streamId);
      } else {
        // For demo, restart with same config
        await streamApi.start({
          stream_id: streamId,
          source: '0',
          source_type: 'webcam',
        });
      }
      fetchCameras();
    } catch (err) {
      console.error('Failed to control stream:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-dark p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-cyber-blue">Loading cameras...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-dark p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Cameras</h1>
            <p className="text-white/60 mt-1">
              {isBackendConnected 
                ? `${cameras.length} active stream${cameras.length !== 1 ? 's' : ''}`
                : 'Connect to backend to see live streams'
              }
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/live">
              <Button className="bg-cyber-green hover:bg-cyber-green/80 text-cyber-dark">
                <Eye className="w-4 h-4 mr-2" />
                Live View
              </Button>
            </Link>
            <Button className="bg-cyber-blue hover:bg-cyber-blue-light text-cyber-dark">
              <Plus className="w-4 h-4 mr-2" />
              Add Camera
            </Button>
          </div>
        </div>

        {!isBackendConnected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-cyber-red/10 border border-cyber-red/30 flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-cyber-red" />
            <div>
              <p className="text-cyber-red font-medium">Backend Not Connected</p>
              <p className="text-white/60 text-sm">
                Start the backend: <code className="bg-black/30 px-2 py-0.5 rounded">cd backend && python -m uvicorn app.main:app --reload</code>
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid gap-4">
          {cameras.length === 0 ? (
            <div className="glass-panel rounded-xl p-12 text-center">
              <Camera className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60">No active streams</p>
              <p className="text-white/40 text-sm mt-2">
                Start a stream from the backend or add a camera
              </p>
            </div>
          ) : (
            cameras.map((camera, index) => (
              <motion.div
                key={camera.stream_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel rounded-xl p-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    camera.is_active 
                      ? 'bg-cyber-green/10 border border-cyber-green/30' 
                      : 'bg-cyber-red/10 border border-cyber-red/30'
                  }`}>
                    <Camera className={`w-6 h-6 ${
                      camera.is_active ? 'text-cyber-green' : 'text-cyber-red'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{camera.name}</h3>
                    <p className="text-sm text-white/60">
                      {camera.resolution} • {camera.fps?.toFixed(1)} FPS • {camera.frame_count} frames
                    </p>
                    <p className="text-xs text-white/40">
                      Runtime: {Math.floor(camera.runtime / 60)}m {Math.floor(camera.runtime % 60)}s
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href={`/live?stream=${camera.stream_id}`}>
                    <Button variant="ghost" size="sm" className="text-cyber-blue hover:text-cyber-blue-light">
                      <Eye className="w-4 h-4 mr-1" />
                      Watch
                    </Button>
                  </Link>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    camera.is_active
                      ? 'bg-cyber-green/20 text-cyber-green'
                      : 'bg-cyber-red/20 text-cyber-red'
                  }`}>
                    {camera.is_active ? 'Online' : 'Offline'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white/60 hover:text-white"
                    onClick={() => handleStartStop(camera.stream_id, camera.is_active)}
                  >
                    {camera.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white/60 hover:text-cyber-red">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
