'use client';

import { motion } from 'framer-motion';
import { Maximize2, MapPin } from 'lucide-react';
import { useState } from 'react';

// Example threat locations (x, y percentages)
const locations = [
  { id: 1, name: 'Sector 7G', x: 25, y: 35, level: 'low', cameras: 12 },
  { id: 2, name: 'North Node', x: 65, y: 20, level: 'high', cameras: 4 },
  { id: 3, name: 'Central Hub', x: 48, y: 45, level: 'critical', cameras: 32 },
  { id: 4, name: 'East Wing', x: 80, y: 55, level: 'medium', cameras: 8 },
  { id: 5, name: 'South Port', x: 35, y: 75, level: 'low', cameras: 15 },
  { id: 6, name: 'West Gate', x: 15, y: 50, level: 'low', cameras: 6 },
];

export function InteractiveMap() {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-cyber-red shadow-[0_0_15px_rgba(239,68,68,0.8)]';
      case 'high': return 'bg-cyber-yellow shadow-[0_0_15px_rgba(245,158,11,0.8)]';
      case 'medium': return 'bg-cyber-purple shadow-[0_0_15px_rgba(124,58,237,0.8)]';
      default: return 'bg-cyber-blue shadow-[0_0_15px_rgba(0,229,255,0.8)]';
    }
  };

  const getPulseColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-cyber-red';
      case 'high': return 'bg-cyber-yellow';
      case 'medium': return 'bg-cyber-purple';
      default: return 'bg-cyber-blue';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-lg font-display font-bold text-white">Global Threat Heatmap</h3>
          <p className="text-xs text-white/50 font-mono">LIVE TRACKING • 6 ACTIVE ZONES</p>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Maximize2 className="w-4 h-4 text-white/70" />
        </button>
      </div>

      <div className="flex-1 relative w-full rounded-xl overflow-hidden bg-cyber-darker/50 border border-white/5">
        {/* Background Grid */}
        <div className="absolute inset-0 cyber-grid-bg opacity-20"></div>
        
        {/* SVG World Map Base (Abstract simplified) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <svg viewBox="0 0 1000 500" className="w-full h-full fill-white/10 stroke-cyber-blue/30 stroke-[0.5]">
            <path d="M150,150 Q200,100 250,150 T350,150 T450,200 T550,150 T650,250 T750,200 T850,250 T900,350 T800,400 T700,350 T600,450 T500,400 T400,450 T300,350 T200,400 T100,300 Z" />
            <path d="M700,100 Q750,50 800,100 T900,100 T950,150 T850,200 T750,150 Z" />
            <path d="M50,250 Q100,200 150,250 T200,300 T100,350 Z" />
          </svg>
        </div>

        {/* Scan line animation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-[2px] bg-cyber-blue/30 shadow-[0_0_10px_rgba(0,229,255,0.5)] animate-scan opacity-50" />
        </div>

        {/* Location Nodes */}
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
            onMouseEnter={() => setHoveredNode(loc.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Pulse Ring */}
            {(loc.level === 'critical' || loc.level === 'high') && (
              <div className={`absolute -inset-4 rounded-full ${getPulseColor(loc.level)} opacity-30 animate-ping`} style={{ animationDuration: loc.level === 'critical' ? '1s' : '2s' }} />
            )}
            
            {/* Core Dot */}
            <div className={`w-3 h-3 rounded-full relative z-10 ${getThreatColor(loc.level)}`} />

            {/* Hover Card */}
            {hoveredNode === loc.id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 glass-panel p-3 rounded-xl z-50 pointer-events-none"
              >
                <div className="flex items-start gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-cyber-blue shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white leading-tight">{loc.name}</div>
                    <div className="text-[10px] font-mono text-white/60">ZONE {loc.id}00</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
                  <div>
                    <div className="text-[9px] text-white/40 uppercase">Cameras</div>
                    <div className="text-xs font-mono text-white font-semibold">{loc.cameras}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-white/40 uppercase">Status</div>
                    <div className={`text-[10px] font-bold uppercase ${
                      loc.level === 'critical' ? 'text-cyber-red' :
                      loc.level === 'high' ? 'text-cyber-yellow' : 'text-cyber-blue'
                    }`}>
                      {loc.level}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
