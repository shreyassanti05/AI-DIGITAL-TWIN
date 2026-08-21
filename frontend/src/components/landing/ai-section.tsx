'use client';

import { motion } from 'framer-motion';
import { 
  Brain, 
  Cpu, 
  Eye, 
  Zap,
  Target,
  Layers,
  Network,
  Activity
} from 'lucide-react';

const aiFeatures = [
  {
    icon: Eye,
    title: 'YOLOv11 Detection',
    description: 'State-of-the-art object detection with 99.7% accuracy processing 30 FPS',
    stats: '30 FPS',
  },
  {
    icon: Network,
    title: 'DeepSORT Tracking',
    description: 'Advanced multi-object tracking maintaining identity across frames',
    stats: '100+ Objects',
  },
  {
    icon: Brain,
    title: 'Behavior Analysis',
    description: 'CNN + BiLSTM networks detect suspicious activities and violence',
    stats: '12 Models',
  },
  {
    icon: Target,
    title: 'Pose Estimation',
    description: 'MediaPipe integration for fall detection and gesture recognition',
    stats: '33 Landmarks',
  },
];

export function AISection() {
  return (
    <section id="ai" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6"
            >
              <Brain className="w-4 h-4 text-cyber-purple" />
              <span className="text-sm text-white/80 font-mono tracking-wider">
                ADVANCED AI ENGINE
              </span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6">
              Powered by{' '}
              <span className="cyber-text-gradient">Cutting-Edge AI</span>
            </h2>

            <p className="text-lg text-white/60 mb-8">
              Our platform combines multiple state-of-the-art AI models to deliver 
              unparalleled surveillance capabilities. From YOLOv11 object detection 
              to custom violence detection networks, every component is optimized 
              for real-time performance.
            </p>

            {/* AI Pipeline Visualization */}
            <div className="glass-panel rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between text-sm">
                {['Input', 'YOLO', 'Track', 'Classify', 'Alert'].map((step, i) => (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-lg bg-cyber-blue/20 border border-cyber-blue/30 flex items-center justify-center mb-2">
                        <span className="text-cyber-blue font-mono text-xs">{i + 1}</span>
                      </div>
                      <span className="text-white/60 text-xs">{step}</span>
                    </div>
                    {i < 4 && (
                      <div className="w-8 h-px bg-cyber-blue/30 mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Framework', value: 'PyTorch 2.0' },
                { label: 'Acceleration', value: 'CUDA + TensorRT' },
                { label: 'Inference', value: '< 50ms latency' },
                { label: 'Precision', value: 'FP16 Mixed' },
              ].map((item) => (
                <div key={item.label} className="glass-panel rounded-lg p-3">
                  <div className="text-xs text-white/40">{item.label}</div>
                  <div className="text-sm text-white font-mono">{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - AI Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {aiFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="glass-panel rounded-xl p-5 group"
              >
                <div className="w-12 h-12 rounded-lg bg-cyber-purple/10 border border-cyber-purple/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-cyber-purple" />
                </div>
                <div className="text-xs text-cyber-purple font-mono mb-1">{feature.stats}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
