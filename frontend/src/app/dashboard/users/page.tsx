'use client';

import { motion } from 'framer-motion';
import { Users, Plus, Mail, Shield, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const users = [
  { id: 1, name: 'Admin User', email: 'admin@ai-surveillance.com', role: 'admin', status: 'active' },
  { id: 2, name: 'Security Operator', email: 'operator@ai-surveillance.com', role: 'operator', status: 'active' },
  { id: 3, name: 'Viewer User', email: 'viewer@ai-surveillance.com', role: 'viewer', status: 'inactive' },
];

const roleColors = {
  admin: 'bg-cyber-purple/20 text-cyber-purple',
  operator: 'bg-cyber-blue/20 text-cyber-blue',
  viewer: 'bg-white/10 text-white/60',
};

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-cyber-dark p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Users</h1>
            <p className="text-white/60 mt-1">Manage user accounts and permissions</p>
          </div>
          <Button className="bg-cyber-blue hover:bg-cyber-blue-light text-cyber-dark">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="grid gap-4">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel rounded-xl p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center">
                  <span className="text-white font-semibold">{user.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  roleColors[user.role as keyof typeof roleColors]
                }`}>
                  <Shield className="w-3 h-3" />
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-cyber-red">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
