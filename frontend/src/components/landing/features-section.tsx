'use client';

import { motion } from 'framer-motion';
import { 
  Shield, 
  Eye, 
  Brain, 
  Zap, 
  Radio, 
  Activity,
  Camera,
  AlertTriangle,
  Lock,
  BarChart3,
  Globe,
  Cpu
} from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'Real-Time Detection',
    description: 'YOLOv11-powered object detection processing 30 FPS with 99.7% accuracy for instant threat identification.',
    color: 'cyber-blue',
  },
  {
    icon: Brain,
    title: 'AI Behavior Analysis',
    description: 'Deep learning models analyze suspicious activities, violence patterns, and anomalous crowd behavior.',
    color: 'cyber-purple',
  },
  {
    icon: Shield,
    title: 'Weapon Detection',
    description: 'Advanced weapon classification identifying guns, knives, and dangerous objects in real-time.',
    color: 'cyber-green',
  },
  {
    icon: Activity,
    title: 'Fall Detection',
    description: 'Pose estimation and LSTM networks detect falls and medical emergencies automatically.',
    color: 'cyber-yellow',
  },
  {
    icon: Radio,
    title: 'Multi-Camera Support',
    description: 'Seamlessly manage 100+ camera streams with RTSP, WebRTC, and HTTP protocol support.',
    color: 'cyber-pink',
  },
  {
    icon: AlertTriangle,
    title: 'Smart Alerts',
    description: 'Instant notifications via Telegram, Email, SMS, and push alerts with AI-generated summaries.',
    color: 'cyber-red',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Comprehensive threat statistics, heatmaps, and trend analysis with real-time visualization.',
    color: 'cyber-blue',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Military-grade encryption, JWT authentication, and RBAC for secure access control.',
    color: 'cyber-purple',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6"
          >
            <Cpu className="w-4 h-4 text-cyber-blue" />
            <span className="text-sm text-white/80 font-mono tracking-wider">
              AI-POWERED CAPABILITIES
            </span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Comprehensive{' '}
            <span className="cyber-text-gradient">Surveillance Suite</span>
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Enterprise-grade security features powered by cutting-edge AI technology. 
            From threat detection to intelligent analytics, we've got you covered.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group"
            >
              <div className="h-full glass-panel rounded-2xl p-6 hover:border-cyber-blue/30 transition-all duration-300">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-${feature.color}/10 border border-${feature.color}/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className="mt-4 flex items-center text-cyber-blue opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Learn more</span>
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { value: '30+', label: 'AI Models' },
            { value: '99.7%', label: 'Detection Accuracy' },
            { value: '<50ms', label: 'Response Time' },
            { value: '24/7', label: 'Monitoring' },
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 glass-panel rounded-xl">
              <div className="text-3xl font-bold cyber-text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
