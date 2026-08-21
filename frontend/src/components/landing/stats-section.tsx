'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  Eye,
  TrendingUp,
  Clock,
  Target,
  CheckCircle
} from 'lucide-react';

const stats = [
  { 
    icon: Shield, 
    value: 1247, 
    suffix: '+', 
    label: 'Threats Blocked',
    description: 'Successfully detected and alerted',
    color: 'cyber-green'
  },
  { 
    icon: Eye, 
    value: 24, 
    suffix: '/7', 
    label: 'Active Monitoring',
    description: 'Non-stop surveillance coverage',
    color: 'cyber-blue'
  },
  { 
    icon: AlertTriangle, 
    value: 99.7, 
    suffix: '%', 
    label: 'Detection Accuracy',
    description: 'Industry-leading precision',
    color: 'cyber-yellow'
  },
  { 
    icon: Clock, 
    value: 50, 
    suffix: 'ms', 
    label: 'Alert Latency',
    description: 'Real-time threat notification',
    color: 'cyber-purple'
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const steps = 60;
          const stepValue = value / steps;
          let current = 0;
          
          const timer = setInterval(() => {
            current += stepValue;
            if (current >= value) {
              setDisplayValue(value);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, duration / steps);

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
      {displayValue.toLocaleString()}{suffix}
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 cyber-grid-bg opacity-5" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Trusted by <span className="cyber-text-gradient">Enterprise</span> Security Teams
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Our AI surveillance platform powers security operations for Fortune 500 companies, 
            smart cities, and critical infrastructure worldwide.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-panel rounded-2xl p-6 text-center group hover:border-cyber-blue/30 transition-all duration-300"
            >
              <div className={`w-14 h-14 mx-auto rounded-xl bg-${stat.color}/10 border border-${stat.color}/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-7 h-7 text-${stat.color}`} />
              </div>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <h3 className="text-lg font-semibold text-white mt-2">{stat.label}</h3>
              <p className="text-sm text-white/50 mt-1">{stat.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-panel rounded-2xl p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {[
              { label: 'Fortune 500', value: '150+' },
              { label: 'Smart Cities', value: '45+' },
              { label: 'Cameras Monitored', value: '500K+' },
              { label: 'Countries', value: '30+' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-cyber-blue mb-1">{item.value}</div>
                <div className="text-sm text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
