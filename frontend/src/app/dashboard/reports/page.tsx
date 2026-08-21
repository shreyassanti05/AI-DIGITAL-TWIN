'use client';

import { motion } from 'framer-motion';
import { FileText, Download, Plus, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const reports = [
  { id: 1, name: 'Daily Security Report', type: 'Daily', date: '2024-01-15', size: '2.4 MB', status: 'completed' },
  { id: 2, name: 'Weekly Incident Summary', type: 'Weekly', date: '2024-01-14', size: '5.1 MB', status: 'completed' },
  { id: 3, name: 'Monthly Threat Analysis', type: 'Monthly', date: '2024-01-01', size: '12.8 MB', status: 'completed' },
  { id: 4, name: 'Q4 2023 Compliance Report', type: 'Quarterly', date: '2023-12-31', size: '28.3 MB', status: 'completed' },
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-cyber-dark p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Reports</h1>
            <p className="text-white/60 mt-1">Generate and download security reports</p>
          </div>
          <Button className="bg-cyber-blue hover:bg-cyber-blue-light text-cyber-dark">
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>

        <div className="grid gap-4">
          {reports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel rounded-xl p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyber-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{report.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {report.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.type}
                    </span>
                    <span>{report.size}</span>
                  </div>
                </div>
              </div>
              
              <Button variant="ghost" className="text-cyber-blue hover:text-cyber-blue-light">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
