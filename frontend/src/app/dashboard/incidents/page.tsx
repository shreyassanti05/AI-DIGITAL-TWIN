'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Filter, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const incidents = [
  { id: 1, type: 'Suspicious Activity', severity: 'high', camera: 'CAM_01', time: '2024-01-15 14:32:10', status: 'active' },
  { id: 2, type: 'Person Detected', severity: 'low', camera: 'CAM_03', time: '2024-01-15 14:28:45', status: 'resolved' },
  { id: 3, type: 'Crowd Anomaly', severity: 'medium', camera: 'CAM_02', time: '2024-01-15 14:15:22', status: 'active' },
  { id: 4, type: 'Motion Alert', severity: 'low', camera: 'CAM_05', time: '2024-01-15 13:58:12', status: 'false_positive' },
];

const severityColors = {
  low: 'bg-cyber-green/20 text-cyber-green',
  medium: 'bg-cyber-yellow/20 text-cyber-yellow',
  high: 'bg-cyber-red/20 text-cyber-red',
  critical: 'bg-red-900/30 text-red-400',
};

const statusColors = {
  active: 'bg-cyber-blue/20 text-cyber-blue',
  resolved: 'bg-cyber-green/20 text-cyber-green',
  false_positive: 'bg-white/10 text-white/60',
};

export default function IncidentsPage() {
  return (
    <div className="min-h-screen bg-cyber-dark p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Incidents</h1>
            <p className="text-white/60 mt-1">Review and manage security incidents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="glass-panel rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr className="text-left text-sm text-white/60">
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Severity</th>
                <th className="p-4 font-medium">Camera</th>
                <th className="p-4 font-medium">Time</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident, index) => (
                <motion.tr
                  key={incident.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-5 h-5 ${
                        incident.severity === 'high' ? 'text-cyber-red' : 'text-cyber-yellow'
                      }`} />
                      <span className="text-white">{incident.type}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${severityColors[incident.severity as keyof typeof severityColors]}`}>
                      {incident.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-white/80">{incident.camera}</td>
                  <td className="p-4 text-white/60">{incident.time}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[incident.status as keyof typeof statusColors]}`}>
                      {incident.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" className="text-cyber-blue hover:text-cyber-blue-light">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
