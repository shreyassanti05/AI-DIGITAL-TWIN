'use client';

import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Database, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-cyber-dark p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-white mb-8">Settings</h1>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 shrink-0">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 glass-panel rounded-xl p-6"
          >
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">General Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Platform Name</label>
                    <input
                      type="text"
                      defaultValue="AI Surveillance Platform"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyber-blue focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Default Language</label>
                    <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyber-blue focus:outline-none">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Time Zone</label>
                    <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyber-blue focus:outline-none">
                      <option>UTC-08:00 Pacific Time</option>
                      <option>UTC-05:00 Eastern Time</option>
                      <option>UTC+00:00 GMT</option>
                      <option>UTC+05:30 India Time</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">Notification Settings</h2>
                
                <div className="space-y-4">
                  {[
                    { label: 'Email Alerts', desc: 'Receive email notifications for critical alerts', checked: true },
                    { label: 'Push Notifications', desc: 'Browser push notifications', checked: true },
                    { label: 'Telegram Alerts', desc: 'Send alerts to Telegram bot', checked: false },
                    { label: 'SMS Notifications', desc: 'SMS alerts for critical incidents', checked: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 glass-panel rounded-lg">
                      <div>
                        <div className="text-white font-medium">{item.label}</div>
                        <div className="text-sm text-white/60">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={item.checked}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 text-cyber-blue focus:ring-cyber-blue"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyber-blue focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Max Login Attempts</label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyber-blue focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 glass-panel rounded-lg">
                    <div>
                      <div className="text-white font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-white/60">Require 2FA for all admin users</div>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-cyber-blue focus:ring-cyber-blue"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-4">System Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">AI Confidence Threshold</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="50"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/40 mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Video Processing FPS</label>
                    <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyber-blue focus:outline-none">
                      <option>15 FPS</option>
                      <option selected>30 FPS</option>
                      <option>60 FPS</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Data Retention (days)</label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyber-blue focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <Button className="bg-cyber-blue hover:bg-cyber-blue-light text-cyber-dark">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
