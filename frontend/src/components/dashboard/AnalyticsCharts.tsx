'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity } from 'lucide-react';

const data = [
  { time: '00:00', detections: 12 },
  { time: '04:00', detections: 8 },
  { time: '08:00', detections: 45 },
  { time: '12:00', detections: 89 },
  { time: '16:00', detections: 72 },
  { time: '20:00', detections: 34 },
  { time: '24:00', detections: 15 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border-cyber-blue/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
        <p className="text-white/60 text-xs font-mono mb-1">{label}</p>
        <p className="text-cyber-blue font-bold text-sm">
          {payload[0].value} <span className="text-white/80 font-normal">Detections</span>
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsCharts() {
  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyber-purple" />
            Activity Distribution
          </h3>
          <p className="text-xs text-white/50 font-mono">24H THREAT ANALYSIS</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse" />
          <span className="text-xs text-white/70 font-mono">LIVE UPDATE</span>
        </div>
      </div>

      <div className="flex-1 min-h-[200px] w-full relative">
        {/* Glow behind chart */}
        <div className="absolute inset-0 bg-cyber-purple/5 blur-2xl rounded-full" />
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              fontFamily="monospace"
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              fontFamily="monospace"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="detections" 
              stroke="#00E5FF" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorDetections)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
