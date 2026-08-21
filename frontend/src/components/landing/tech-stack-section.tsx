'use client';

import { motion } from 'framer-motion';

const technologies = [
  { name: 'Next.js', category: 'Frontend', color: '#00d4ff' },
  { name: 'React', category: 'Frontend', color: '#00d4ff' },
  { name: 'TypeScript', category: 'Frontend', color: '#00d4ff' },
  { name: 'Tailwind CSS', category: 'Frontend', color: '#00d4ff' },
  { name: 'Framer Motion', category: 'Frontend', color: '#00d4ff' },
  { name: 'Three.js', category: 'Frontend', color: '#00d4ff' },
  { name: 'FastAPI', category: 'Backend', color: '#a855f7' },
  { name: 'Python', category: 'Backend', color: '#a855f7' },
  { name: 'PostgreSQL', category: 'Database', color: '#a855f7' },
  { name: 'Redis', category: 'Database', color: '#a855f7' },
  { name: 'YOLOv11', category: 'AI/ML', color: '#ec4899' },
  { name: 'PyTorch', category: 'AI/ML', color: '#ec4899' },
  { name: 'TensorRT', category: 'AI/ML', color: '#ec4899' },
  { name: 'OpenCV', category: 'AI/ML', color: '#ec4899' },
  { name: 'Docker', category: 'DevOps', color: '#10b981' },
  { name: 'Kubernetes', category: 'DevOps', color: '#10b981' },
  { name: 'NGINX', category: 'DevOps', color: '#10b981' },
  { name: 'Prometheus', category: 'DevOps', color: '#10b981' },
];

export function TechStackSection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Built With <span className="cyber-text-gradient">Modern Tech</span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Our platform leverages the latest technologies for maximum performance, scalability, and reliability.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="glass-panel rounded-lg px-4 py-3 flex items-center gap-3"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tech.color, boxShadow: `0 0 10px ${tech.color}` }}
              />
              <div>
                <div className="text-sm font-semibold text-white">{tech.name}</div>
                <div className="text-xs text-white/40">{tech.category}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
