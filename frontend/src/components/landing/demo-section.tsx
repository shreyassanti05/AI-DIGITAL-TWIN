'use client';

import { motion } from 'framer-motion';
import { Play, Pause, Volume2, Maximize, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function DemoSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="demo" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            See It In <span className="cyber-text-gradient">Action</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Watch real-time threat detection with AI-powered analysis and instant alerts.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative aspect-video max-w-5xl mx-auto"
        >
          <div className="glass-panel rounded-2xl overflow-hidden">
            {/* Video Player Mock */}
            <div className="relative aspect-video bg-cyber-dark">
              {/* Placeholder for video */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyber-blue/20 flex items-center justify-center cursor-pointer hover:bg-cyber-blue/30 transition-colors">
                    {isPlaying ? (
                      <Pause className="w-10 h-10 text-cyber-blue" />
                    ) : (
                      <Play className="w-10 h-10 text-cyber-blue ml-1" />
                    )}
                  </div>
                  <p className="text-white/60">Click to watch demo</p>
                </div>
              </div>

              {/* Detection Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Bounding Box */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-1/3 left-1/4 w-32 h-48 border-2 border-cyber-red"
                >
                  <div className="absolute -top-6 left-0 bg-cyber-red text-white text-xs px-2 py-1 rounded">
                    PERSON 94%
                  </div>
                </motion.div>

                {/* Another Detection */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-1/2 right-1/3 w-24 h-36 border-2 border-cyber-yellow"
                >
                  <div className="absolute -top-6 left-0 bg-cyber-yellow text-cyber-dark text-xs px-2 py-1 rounded">
                    SUSPICIOUS 87%
                  </div>
                </motion.div>
              </div>

              {/* HUD Overlay */}
              <div className="absolute inset-0 p-4 pointer-events-none">
                {/* Top Bar */}
                <div className="flex justify-between items-start">
                  <div className="glass-panel rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-xs text-white/80">
                      <span className="w-2 h-2 rounded-full bg-cyber-red animate-pulse" />
                      LIVE DETECTION
                    </div>
                  </div>
                  <div className="glass-panel rounded-lg px-3 py-2 text-xs text-white/80">
                    CAM_01 | Zone A | 30 FPS
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="space-y-2">
                    <div className="glass-panel rounded-lg px-3 py-2 text-xs">
                      <div className="text-white/60">AI Status</div>
                      <div className="text-cyber-green font-semibold">ANALYZING...</div>
                    </div>
                  </div>

                  {/* Detection Log */}
                  <div className="glass-panel rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-4 h-4 text-cyber-green" />
                      <span className="text-white/80">Person detected</span>
                      <span className="text-white/40">12:34:56</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <AlertCircle className="w-4 h-4 text-cyber-yellow" />
                      <span className="text-white/80">Suspicious activity</span>
                      <span className="text-white/40">12:34:52</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    <Volume2 className="w-5 h-5 text-white/60" />
                  </div>
                  <Maximize className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
