'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ShieldAlert, Crosshair, Flame, Play } from 'lucide-react';

const detections = [
  { id: 1, type: 'WEAPON DETECTED', confidence: 98.5, camera: 'CAM-03', time: '10:24:32', severity: 'critical', icon: Crosshair },
  { id: 2, type: 'FIGHTING', confidence: 92.1, camera: 'CAM-06', time: '10:15:05', severity: 'high', icon: ShieldAlert },
  { id: 3, type: 'SMOKE', confidence: 85.0, camera: 'CAM-02', time: '09:42:11', severity: 'medium', icon: Flame },
  { id: 4, type: 'UNAUTHORIZED ENTRY', confidence: 99.9, camera: 'CAM-08', time: '09:12:44', severity: 'high', icon: AlertCircle },
];

export function RecentDetections() {
  const getSeverityStyle = (severity: string) => {
    switch(severity) {
      case 'critical': return 'text-cyber-red bg-cyber-red/10 border-cyber-red/30';
      case 'high': return 'text-cyber-yellow bg-cyber-yellow/10 border-cyber-yellow/30';
      case 'medium': return 'text-cyber-purple bg-cyber-purple/10 border-cyber-purple/30';
      default: return 'text-cyber-blue bg-cyber-blue/10 border-cyber-blue/30';
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-cyber-red animate-pulse" />
          Recent Threats
        </h3>
        <button className="text-xs text-cyber-blue hover:text-cyber-blue-light uppercase tracking-wider font-mono">
          View All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {detections.map((det, i) => (
          <motion.div
            key={det.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`border rounded-xl p-3 flex gap-3 items-center group cursor-pointer hover:bg-white/5 transition-colors ${getSeverityStyle(det.severity)}`}
          >
            {/* Thumbnail Placeholder */}
            <div className="w-16 h-16 rounded-lg bg-black/40 border border-white/10 relative overflow-hidden shrink-0 flex items-center justify-center">
              <det.icon className={`w-6 h-6 opacity-50 ${det.severity === 'critical' ? 'text-cyber-red animate-pulse' : 'text-white'}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <Play className="w-4 h-4 text-white absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="text-sm font-bold text-white truncate group-hover:text-cyber-blue transition-colors">{det.type}</div>
                <div className="text-[10px] font-mono text-white/50 shrink-0">{det.time}</div>
              </div>
              
              <div className="flex items-center gap-3 mt-1.5">
                <div className="text-[10px] font-mono text-white/70 flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-cyber-blue" />
                  {det.confidence}%
                </div>
                <div className="text-[10px] font-mono text-white/70 flex items-center gap-1 border-l border-white/20 pl-3">
                  {det.camera}
                </div>
              </div>
            </div>
            
            {/* Severity Badge */}
            <div className="hidden sm:block px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border bg-black/20 shrink-0" style={{
              borderColor: 'inherit',
              color: 'inherit'
            }}>
              {det.severity}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
