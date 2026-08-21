'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { HeroSection } from './hero-section';
import { FeaturesSection } from './features-section';
import { StatsSection } from './stats-section';
import { DemoSection } from './demo-section';
import { AISection } from './ai-section';
import { TechStackSection } from './tech-stack-section';
import { CTASection } from './cta-section';
import { Footer } from './footer';
import { Navigation } from './navigation';

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden">
      {/* Animated Background */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ y: backgroundY, opacity }}
      >
        {/* Grid Background */}
        <div className="absolute inset-0 cyber-grid-bg opacity-20" />
        
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-cyber-blue/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-80 h-80 bg-cyber-purple/10 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          className="absolute bottom-40 left-1/3 w-72 h-72 bg-cyber-pink/10 rounded-full blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
        />
      </motion.div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <DemoSection />
        <AISection />
        <TechStackSection />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
