'use client';

import { Activity, Database, Server, Wifi } from 'lucide-react';

export function Footer() {
  return (
    <footer className="h-12 glass-panel border-t border-white/10 mt-auto flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-6 text-[10px] font-mono text-white/50 tracking-wider">
        <span>AETHER SOC v3.4.1</span>
        <span className="hidden md:inline">ENCRYPTED CONNECTION</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 group">
          <Server className="w-3.5 h-3.5 text-cyber-green group-hover:animate-pulse" />
          <span className="text-[10px] font-mono text-white/60">BACKEND: ONLINE</span>
        </div>
        
        <div className="flex items-center gap-2 group">
          <Database className="w-3.5 h-3.5 text-cyber-green group-hover:animate-pulse" />
          <span className="text-[10px] font-mono text-white/60">DB: SYNCED</span>
        </div>
        
        <div className="flex items-center gap-2 group">
          <Activity className="w-3.5 h-3.5 text-cyber-blue group-hover:animate-pulse" />
          <span className="text-[10px] font-mono text-white/60">API: 99.9%</span>
        </div>
        
        <div className="flex items-center gap-2 group">
          <Wifi className="w-3.5 h-3.5 text-cyber-green group-hover:animate-pulse" />
          <span className="text-[10px] font-mono text-white/60">WSS: CONNECTED</span>
        </div>
      </div>
    </footer>
  );
}
