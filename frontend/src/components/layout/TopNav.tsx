'use client';

import { Search, Bell, Mic, User, Server } from 'lucide-react';
import { useState, useEffect } from 'react';

export function TopNav() {
  const [time, setTime] = useState<string>('');
  
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-20 glass-panel border-b border-white/10 flex items-center justify-between px-8 sticky top-0 z-50">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-white/40 group-focus-within:text-cyber-blue transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search cameras, incidents, users..." 
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 py-2.5 outline-none focus:border-cyber-blue/50 focus:bg-white/10 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] font-sans text-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
            <div className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-white/60">⌘K</div>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 ml-8">
        {/* System Status */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
          <Server className="w-4 h-4 text-cyber-blue" />
          <span className="text-xs font-mono text-white/80">LATENCY: 12ms</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyber-blue neon-glow animate-pulse ml-2" />
        </div>

        {/* Current Time */}
        <div className="text-sm font-mono text-cyber-blue tracking-widest px-4 border-r border-white/10">
          {time}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="relative p-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-cyber-purple/50 transition-all group">
            <Mic className="w-5 h-5 text-white/70 group-hover:text-cyber-purple" />
          </button>
          
          <button className="relative p-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-cyber-yellow/50 transition-all group">
            <Bell className="w-5 h-5 text-white/70 group-hover:text-cyber-yellow" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-cyber-red rounded-full border border-cyber-dark animate-pulse" />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden md:block">
            <div className="text-sm font-medium text-white">Commander Shepard</div>
            <div className="text-[10px] text-cyber-blue font-mono uppercase tracking-wider">Level 5 Clearance</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-cyber-darker border border-cyber-blue/30 overflow-hidden relative p-0.5">
            <div className="absolute inset-0 bg-cyber-blue/20 animate-spin-slow"></div>
            <div className="w-full h-full rounded-full bg-cyber-dark flex items-center justify-center relative z-10">
              <User className="w-5 h-5 text-cyber-blue" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
