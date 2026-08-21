'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Activity, Calendar } from 'lucide-react';

const stats = [
  { label: 'Total Detections', value: '12,458', change: '+12%', trend: 'up' },
  { label: 'Avg Daily Alerts', value: '45', change: '-5%', trend: 'down' },
  { label: 'Threat Accuracy', value: '99.2%', change: '+2%', trend: 'up' },
  { label: 'System Uptime', value: '99.9%', change: '0%', trend: 'neutral' },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-cyber-dark p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">Analytics</h1>
          <p className="text-white/60 mt-1">Security insights and performance metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">{stat.label}</span>
                <span className={`text-xs font-medium ${
                  stat.trend === 'up' ? 'text-cyber-green' : 
                  stat.trend === 'down' ? 'text-cyber-red' : 'text-white/40'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass-panel rounded-xl p-6 aspect-video flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Detection Trends</h3>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Calendar className="w-4 h-4" />
                Last 7 Days
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">Chart visualization would appear here</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-panel rounded-xl p-6 aspect-video flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Threat Distribution</h3>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <Activity className="w-4 h-4" />
                By Zone
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">Analytics visualization would appear here</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
