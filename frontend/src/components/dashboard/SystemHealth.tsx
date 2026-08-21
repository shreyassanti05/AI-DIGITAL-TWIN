'use client';

import { motion } from 'framer-motion';
import { Cpu, HardDrive, Network, Database } from 'lucide-react';

const healthMetrics = [
  { label: 'CPU LOAD', value: 42, icon: Cpu, color: 'cyber-blue' },
  { label: 'GPU VRAM', value: 87, icon: Database, color: 'cyber-purple' },
  { label: 'STORAGE', value: 65, icon: HardDrive, color: 'cyber-green' },
  { label: 'NETWORK', value: 24, icon: Network, color: 'cyber-blue' },
];

export function SystemHealth() {
  return (
    <div className="glass-panel p-6 rounded-2xl h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyber-blue" />
          System Health
        </h3>
        <span className="text-xs text-cyber-green font-mono uppercase border border-cyber-green/30 px-2 py-1 rounded bg-cyber-green/10">Optimal</span>
      </div>

      <div className="space-y-5">
        {healthMetrics.map((metric, i) => (
          <div key={metric.label} className="group">
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-white/70 flex items-center gap-2">
                <metric.icon className={`w-3.5 h-3.5 text-${metric.color}`} />
                {metric.label}
              </span>
              <span className={`text-white font-bold group-hover:text-${metric.color} transition-colors`}>{metric.value}%</span>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
              {/* Grid behind progress */}
              <div className="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-20 bg-repeat z-0" />
              
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 1.5, delay: i * 0.1, ease: 'easeOut' }}
                className={`h-full rounded-full relative z-10 bg-${metric.color} shadow-[0_0_10px_currentColor]`}
                style={{ 
                  background: metric.value > 80 
                    ? 'linear-gradient(90deg, var(--cyber-purple) 0%, var(--cyber-red) 100%)' 
                    : `var(--${metric.color})` 
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
