'use client';

import { motion } from 'framer-motion';
import { Camera, Maximize2, Wifi, Zap } from 'lucide-react';
import { useState } from 'react';

const cameraFeeds = [
  { id: 'CAM-01', location: 'Main Entrance', status: 'active', fps: 30, latency: 12, threat: 'low' },
  { id: 'CAM-02', location: 'Terminal B', status: 'active', fps: 28, latency: 15, threat: 'medium' },
  { id: 'CAM-03', location: 'Cargo Bay 4', status: 'active', fps: 30, latency: 10, threat: 'critical', detection: 'WEAPON' },
  { id: 'CAM-04', location: 'Perimeter N', status: 'active', fps: 24, latency: 45, threat: 'low' },
  { id: 'CAM-05', location: 'Server Room', status: 'active', fps: 30, latency: 8, threat: 'low' },
  { id: 'CAM-06', location: 'Parking P2', status: 'active', fps: 29, latency: 18, threat: 'high', detection: 'FIGHTING' },
];

export function LiveCameraGrid() {
  const [hoveredCam, setHoveredCam] = useState<string | null>(null);

  const getThreatBorder = (threat: string) => {
    switch(threat) {
      case 'critical': return 'border-cyber-red/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
      case 'high': return 'border-cyber-yellow/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
      case 'medium': return 'border-cyber-purple/50';
      default: return 'border-white/10 group-hover:border-cyber-blue/50 group-hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]';
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyber-blue" />
            Live Grid
          </h3>
          <p className="text-xs text-white/50 font-mono">6 ACTIVE STREAMS</p>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white flex items-center gap-2 text-sm font-mono">
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:inline">FULLSCREEN</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
        {cameraFeeds.map((cam) => (
          <motion.div
            key={cam.id}
            onMouseEnter={() => setHoveredCam(cam.id)}
            onMouseLeave={() => setHoveredCam(null)}
            className={`relative rounded-xl overflow-hidden bg-cyber-darker border transition-all duration-300 group ${getThreatBorder(cam.threat)}`}
          >
            {/* Simulated Video Feed Background */}
            <div className="absolute inset-0 bg-cyber-darker opacity-80" />
            <div className="absolute inset-0 cyber-grid-bg opacity-10" />
            
            {/* Scanning Line on hover */}
            {hoveredCam === cam.id && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="w-full h-px bg-cyber-blue/50 shadow-[0_0_10px_rgba(0,229,255,0.8)] animate-scan opacity-60" />
              </div>
            )}

            {/* AI Bounding Boxes (Simulated) */}
            {(cam.threat === 'critical' || cam.threat === 'high') && (
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <div className={`border-2 ${cam.threat === 'critical' ? 'border-cyber-red' : 'border-cyber-yellow'} w-24 h-40 border-dashed opacity-70 animate-pulse`} />
              </div>
            )}

            {/* Top Bar overlays */}
            <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold text-white">{cam.id}</span>
                <span className="text-[9px] text-white/60">{cam.location}</span>
              </div>
              <div className="flex gap-1">
                {cam.detection && (
                  <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase animate-pulse ${
                    cam.threat === 'critical' ? 'bg-cyber-red/80 text-white' : 'bg-cyber-yellow/80 text-black'
                  }`}>
                    {cam.detection}
                  </span>
                )}
                <span className="px-1.5 py-0.5 bg-black/50 rounded-sm text-[9px] font-mono text-white flex items-center gap-1 border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse" />
                  REC
                </span>
              </div>
            </div>

            {/* Bottom Bar overlays */}
            <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-end z-20 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] font-mono text-white/70">
                  <Zap className="w-3 h-3 text-cyber-blue" />
                  {cam.fps} FPS
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-white/70">
                  <Wifi className="w-3 h-3 text-cyber-green" />
                  {cam.latency}ms
                </div>
              </div>
              <Maximize2 className="w-4 h-4 text-white/50 cursor-pointer hover:text-white" />
            </div>

            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/20 z-10" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/20 z-10" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
