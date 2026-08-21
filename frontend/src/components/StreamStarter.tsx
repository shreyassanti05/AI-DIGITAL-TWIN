'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Square, Radio } from 'lucide-react';
import { streamApi } from '@/lib/api';

interface StreamStarterProps {
  onStreamStarted: () => void;
  activeStreams?: string[];
}

export function StreamStarter({ onStreamStarted, activeStreams = [] }: StreamStarterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rtspUrl, setRtspUrl] = useState('');
  const [showRtsp, setShowRtsp] = useState(false);
  const [detectionOptions, setDetectionOptions] = useState({
    weapon: true,
    fire: true,
    violence: false,
    fall: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop a stream
  const stopStream = async (streamId: string) => {
    setIsLoading(true);
    try {
      await streamApi.stop(streamId);
      onStreamStarted();
    } catch (error) {
      alert('Failed to stop stream: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Start webcam stream
  const startWebcam = async () => {
    setIsLoading(true);
    try {
      const streamId = `webcam_${Date.now()}`;
      await streamApi.start({
        stream_id: streamId,
        source: '0', // 0 is default webcam
        source_type: 'webcam',
        enable_weapon_detection: detectionOptions.weapon,
        enable_fire_detection: detectionOptions.fire,
        enable_violence_detection: detectionOptions.violence,
        enable_fall_detection: detectionOptions.fall,
      });
      onStreamStarted();
    } catch (error) {
      alert('Failed to start webcam: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Start RTSP stream
  const startRtsp = async () => {
    if (!rtspUrl.trim()) {
      alert('Please enter an RTSP URL');
      return;
    }
    setIsLoading(true);
    try {
      const streamId = `rtsp_${Date.now()}`;
      await streamApi.start({
        stream_id: streamId,
        source: rtspUrl.trim(),
        source_type: 'rtsp',
        enable_weapon_detection: detectionOptions.weapon,
        enable_fire_detection: detectionOptions.fire,
        enable_violence_detection: detectionOptions.violence,
        enable_fall_detection: detectionOptions.fall,
      });
      onStreamStarted();
      setRtspUrl('');
      setShowRtsp(false);
    } catch (error) {
      alert('Failed to start RTSP: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload — sends actual file to backend
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const streamId = `video_${Date.now()}`;

      // Upload actual file via FormData
      await streamApi.uploadVideo(file, {
        stream_id: streamId,
        enable_weapon_detection: detectionOptions.weapon,
        enable_fire_detection: detectionOptions.fire,
        enable_violence_detection: detectionOptions.violence,
        enable_fall_detection: detectionOptions.fall,
      });

      onStreamStarted();
    } catch (error) {
      alert('Failed to upload video: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="glass-panel rounded-xl p-6 space-y-4 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Start Detection</h3>
      
      {/* Detection Options */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={detectionOptions.weapon}
            onChange={(e) => setDetectionOptions(prev => ({ ...prev, weapon: e.target.checked }))}
            className="rounded border-gray-600"
          />
          <span>Weapon Detection</span>
        </label>
        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={detectionOptions.fire}
            onChange={(e) => setDetectionOptions(prev => ({ ...prev, fire: e.target.checked }))}
            className="rounded border-gray-600"
          />
          <span>Fire/Smoke Detection</span>
        </label>
        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={detectionOptions.violence}
            onChange={(e) => setDetectionOptions(prev => ({ ...prev, violence: e.target.checked }))}
            className="rounded border-gray-600"
          />
          <span>Violence Detection</span>
        </label>
        <label className="flex items-center space-x-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={detectionOptions.fall}
            onChange={(e) => setDetectionOptions(prev => ({ ...prev, fall: e.target.checked }))}
            className="rounded border-gray-600"
          />
          <span>Fall Detection</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={startWebcam}
          disabled={isLoading}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Camera className="w-4 h-4 mr-2" />
          {isLoading ? 'Starting...' : 'Start Webcam'}
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Video
        </Button>

        <Button
          onClick={() => setShowRtsp(!showRtsp)}
          disabled={isLoading}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Radio className="w-4 h-4 mr-2" />
          RTSP/CCTV
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* RTSP Input */}
      {showRtsp && (
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            placeholder="rtsp://username:password@ip:port/stream"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500"
          />
          <Button
            onClick={startRtsp}
            disabled={isLoading || !rtspUrl.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Connect
          </Button>
        </div>
      )}

      {/* Active Streams List */}
      {activeStreams.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-white mb-2">Active Streams ({activeStreams.length})</h4>
          <div className="space-y-2">
            {activeStreams.map((streamId) => (
              <div key={streamId} className="flex items-center justify-between bg-white/5 p-2 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-gray-300 font-mono">{streamId}</span>
                </div>
                <Button
                  onClick={() => stopStream(streamId)}
                  disabled={isLoading}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Square className="w-3 h-3 mr-1" fill="currentColor" />
                  Stop
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">
        Start webcam for live detection, upload a video file, or connect to an RTSP/CCTV stream.
      </p>
    </div>
  );
}
