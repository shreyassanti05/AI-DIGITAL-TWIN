'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Play, 
  Shield, 
  Brain,
  Activity,
  Eye,
  Zap,
  Radio
} from 'lucide-react';
import { ParticleBackground } from '../effects/particle-background';
import { RadarAnimation } from '../effects/radar-animation';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 cyber-grid-bg opacity-10" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyber-blue/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyber-purple/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      {/* Scan Line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyber-blue/50 to-transparent"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-green"></span>
              </span>
              <span className="text-sm text-white/80 font-mono tracking-wider">
                AI-POWERED SECURITY v2.0
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-white leading-tight mb-6"
            >
              <span className="block">Next-Gen</span>
              <span className="block cyber-text-gradient">AI Surveillance</span>
              <span className="block text-white/80">Platform</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg sm:text-xl text-white/60 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Real-time threat detection powered by YOLOv11, DeepSORT, and advanced AI. 
              Protect your spaces with military-grade computer vision technology.
            </motion.p>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8"
            >
              {[
                { icon: Eye, label: 'Real-time', value: '30 FPS' },
                { icon: Brain, label: 'AI Models', value: '12+' },
                { icon: Activity, label: 'Accuracy', value: '99.7%' },
                { icon: Zap, label: 'Latency', value: '<50ms' },
              ].map((stat, index) => (
                <div key={index} className="flex items-center gap-2 text-white/70">
                  <stat.icon className="w-4 h-4 text-cyber-blue" />
                  <span className="text-sm font-mono">{stat.label}:</span>
                  <span className="text-sm font-bold text-white">{stat.value}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/monitor">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyber-blue to-cyber-purple hover:from-cyber-blue-light hover:to-cyber-purple-light text-white shadow-cyber-glow-lg text-lg px-8 py-6"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Launch Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-12 flex flex-wrap justify-center lg:justify-start gap-6 text-white/40 text-sm"
            >
              <span>Trusted by:</span>
              {['Tesla', 'Amazon', 'Microsoft', 'Google'].map((company) => (
                <span key={company} className="font-semibold text-white/60">{company}</span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - 3D Visualization */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Main Radar */}
              <RadarAnimation />
              
              {/* Floating Cards */}
              <motion.div
                className="absolute -top-4 -left-4 glass-panel rounded-xl p-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyber-green/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-cyber-green" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Threats Blocked</p>
                    <p className="text-lg font-bold text-white">1,247</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -right-4 glass-panel rounded-xl p-4"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyber-blue/20 flex items-center justify-center">
                    <Radio className="w-5 h-5 text-cyber-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Active Cameras</p>
                    <p className="text-lg font-bold text-white">24/24</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute top-1/2 -right-8 glass-panel rounded-xl p-4"
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyber-purple/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-cyber-purple" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">AI Confidence</p>
                    <p className="text-lg font-bold text-white">98.4%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-xs font-mono tracking-wider">SCROLL TO EXPLORE</span>
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-cyber-blue rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
