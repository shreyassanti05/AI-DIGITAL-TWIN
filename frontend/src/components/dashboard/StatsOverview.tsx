'use client';

import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Camera, Users, AlertTriangle, Activity, Server, Cpu, ShieldAlert, Crosshair } from 'lucide-react';

const stats = [
  { id: 1, label: 'Total Cameras', value: 142, icon: Camera, color: 'cyber-blue' },
  { id: 2, label: 'Online Cameras', value: 138, icon: Activity, color: 'cyber-green' },
  { id: 3, label: 'People Detected', value: 3421, icon: Users, color: 'cyber-purple' },
  { id: 4, label: 'Active Alerts', value: 12, icon: AlertTriangle, color: 'cyber-yellow', pulse: true },
  { id: 5, label: "Today's Incidents", value: 47, icon: ShieldAlert, color: 'cyber-red' },
  { id: 6, label: 'AI Accuracy', value: 99.4, suffix: '%', icon: Crosshair, color: 'cyber-blue' },
  { id: 7, label: 'GPU Usage', value: 84, suffix: '%', icon: Cpu, color: 'cyber-purple' },
  { id: 8, label: 'Server Health', value: 98, suffix: '%', icon: Server, color: 'cyber-green' },
];

export function StatsOverview() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card p-4 relative overflow-hidden group"
        >
          {/* Background Gradient & Pattern */}
          <div className={`absolute inset-0 bg-${stat.color}/5 group-hover:bg-${stat.color}/10 transition-colors duration-500`} />
          <div className="absolute top-0 right-0 w-24 h-24 bg-[url('/assets/grid.svg')] opacity-10 bg-repeat" />
          
          <div className="relative z-10 flex items-start justify-between mb-2">
            <div className={`w-10 h-10 rounded-lg bg-${stat.color}/20 flex items-center justify-center border border-${stat.color}/30 neon-glow-${stat.color.replace('cyber-', '')} ${stat.pulse ? 'animate-pulse' : ''}`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}`} />
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1">
              <CountUp end={stat.value} duration={2.5} separator="," decimals={stat.value % 1 !== 0 ? 1 : 0} />
              {stat.suffix && <span className="text-sm text-white/50">{stat.suffix}</span>}
            </div>
            <div className="text-xs font-sans text-white/60 font-medium uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
          
          {/* Animated decorative corner */}
          <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-${stat.color}/30 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        </motion.div>
      ))}
    </div>
  );
}
