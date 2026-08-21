'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Menu, 
  X, 
  ChevronRight,
  Brain,
  Activity,
  LayoutDashboard
} from 'lucide-react';

const navLinks = [
  { name: 'Features', href: '#features' },
  { name: 'AI Technology', href: '#ai' },
  { name: 'Demo', href: '#demo' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Docs', href: '/docs' },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-cyber-dark/80 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-blue to-cyber-purple flex items-center justify-center group-hover:shadow-cyber-glow transition-shadow duration-300">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-lg bg-cyber-blue/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-lg text-white">
                  AI SURVEILLANCE
                </span>
                <span className="block text-xs text-cyber-blue font-mono tracking-wider">
                  INTELLIGENT THREAT DETECTION
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-white/70 hover:text-white transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyber-blue group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                Sign In
              </Button>
              <Link href="/monitor">
                <Button className="bg-gradient-to-r from-cyber-blue to-cyber-purple hover:from-cyber-blue-light hover:to-cyber-purple-light text-white shadow-cyber-glow">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Launch Dashboard
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-80 bg-cyber-dark border-l border-white/10 p-6"
            >
              <div className="flex flex-col gap-6 mt-20">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between text-lg text-white/70 hover:text-white py-2 border-b border-white/10"
                    >
                      {link.name}
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 space-y-4"
                >
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                  <Link href="/monitor">
                    <Button className="w-full bg-gradient-to-r from-cyber-blue to-cyber-purple text-white">
                      <Activity className="w-4 h-4 mr-2" />
                      Launch Dashboard
                    </Button>
                  </Link>
                </motion.div>

                {/* AI Status Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 p-4 glass-panel rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="w-5 h-5 text-cyber-blue" />
                    <span className="text-sm font-semibold text-white">AI Status</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>System Status</span>
                      <span className="text-cyber-green">Online</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Processing</span>
                      <span className="text-cyber-blue">30 FPS</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Active Models</span>
                      <span className="text-cyber-purple">12</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
