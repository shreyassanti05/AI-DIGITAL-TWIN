'use client';

import { motion } from 'framer-motion';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { InteractiveMap } from '@/components/dashboard/InteractiveMap';
import { LiveCameraGrid } from '@/components/dashboard/LiveCameraGrid';
import { RecentDetections } from '@/components/dashboard/RecentDetections';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { SystemHealth } from '@/components/dashboard/SystemHealth';

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-[1600px] mx-auto w-full pb-10"
    >
      {/* Top Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-wide neon-text">SOC COMMAND CENTER</h1>
          <p className="text-white/60 font-mono text-sm uppercase tracking-widest">Global Surveillance & Threat Management</p>
        </div>
        <div className="hidden lg:flex items-center gap-4 bg-cyber-blue/10 border border-cyber-blue/30 px-4 py-2 rounded-lg neon-glow">
          <div className="w-2 h-2 rounded-full bg-cyber-blue animate-pulse" />
          <span className="text-cyber-blue font-mono font-bold text-sm tracking-widest">SYSTEM OPTIMAL</span>
        </div>
      </div>

      {/* Overview Stats */}
      <StatsOverview />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column (Map & Health) */}
        <div className="xl:col-span-4 space-y-6 flex flex-col h-full">
          <InteractiveMap />
          <div className="flex-1 min-h-[300px]">
            <SystemHealth />
          </div>
        </div>
        
        {/* Middle Column (Live Feeds & Chart) */}
        <div className="xl:col-span-5 space-y-6 flex flex-col h-full">
          <div className="h-[400px]">
            <LiveCameraGrid />
          </div>
          <div className="flex-1 min-h-[300px]">
            <AnalyticsCharts />
          </div>
        </div>
        
        {/* Right Column (Threats) */}
        <div className="xl:col-span-3 h-full">
          <RecentDetections />
        </div>
        
      </div>
    </motion.div>
  );
}
