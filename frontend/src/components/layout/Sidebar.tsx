'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Eye, 
  Camera, 
  AlertTriangle, 
  ShieldAlert, 
  BrainCircuit, 
  Bell, 
  Map, 
  FileText, 
  Users, 
  Settings,
  Shield
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Monitoring', href: '/dashboard/monitor', icon: Eye },
  { name: 'Cameras', href: '/dashboard/cameras', icon: Camera },
  { name: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle },
  { name: 'Threat Analytics', href: '/dashboard/analytics', icon: ShieldAlert },
  { name: 'AI Models', href: '/dashboard/models', icon: BrainCircuit },
  { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  { name: 'Heatmaps', href: '/dashboard/heatmaps', icon: Map },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="w-64 glass-panel border-r border-white/10 flex flex-col h-screen sticky top-0"
    >
      <div className="p-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center neon-glow">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-white tracking-wide text-sm block">AETHER SOC</span>
            <span className="text-[10px] text-cyber-blue font-mono tracking-widest uppercase">Surveillance Platform</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-sans text-sm ${
                isActive
                  ? 'bg-cyber-blue/15 text-cyber-blue border border-cyber-blue/30 shadow-[inset_0_0_20px_rgba(0,229,255,0.1)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-cyber-blue drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]' : ''}`} />
              <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-8 bg-cyber-blue rounded-r-full shadow-[0_0_10px_rgba(0,229,255,0.8)]"
                />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-white/5 mt-auto">
        <div className="glass-card p-4 rounded-xl flex items-center gap-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-cyber-purple/10 bg-grid-pattern opacity-20"></div>
          <div className="w-2 h-2 rounded-full bg-cyber-green neon-glow-green animate-pulse"></div>
          <div>
            <div className="text-xs font-mono text-white/80">SYSTEM SECURE</div>
            <div className="text-[10px] text-cyber-green font-mono">ALL NODES ACTIVE</div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
