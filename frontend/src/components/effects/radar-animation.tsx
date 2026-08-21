'use client';

import { motion } from 'framer-motion';

export function RadarAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer Ring */}
      <motion.div
        className="absolute w-full h-full rounded-full border-2 border-cyber-blue/20"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Middle Ring */}
      <div className="absolute w-3/4 h-3/4 rounded-full border border-cyber-blue/30" />
      
      {/* Inner Ring */}
      <div className="absolute w-1/2 h-1/2 rounded-full border border-cyber-blue/40" />
      
      {/* Center Core */}
      <motion.div
        className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-cyber-blue to-cyber-purple flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-8 h-8 rounded-full bg-cyber-dark" />
      </motion.div>
      
      {/* Rotating Scanner */}
      <motion.div
        className="absolute w-full h-full rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0, 212, 255, 0.3) 60deg, transparent 120deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Pulse Rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-full h-full rounded-full border border-cyber-blue/20"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut',
          }}
        />
      ))}
      
      {/* Target Points */}
      {[
        { angle: 45, distance: 35 },
        { angle: 120, distance: 60 },
        { angle: 200, distance: 45 },
        { angle: 280, distance: 70 },
        { angle: 340, distance: 50 },
      ].map((target, i) => {
        const x = 50 + target.distance * Math.cos((target.angle * Math.PI) / 180);
        const y = 50 + target.distance * Math.sin((target.angle * Math.PI) / 180);
        
        return (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-cyber-green"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <div className="absolute inset-0 rounded-full bg-cyber-green animate-ping" />
          </motion.div>
        );
      })}
      
      {/* Crosshairs */}
      <div className="absolute w-full h-px bg-cyber-blue/20" />
      <div className="absolute h-full w-px bg-cyber-blue/20" />
      
      {/* Corner Brackets */}
      {[
        { position: 'top-0 left-0', rotate: 0 },
        { position: 'top-0 right-0', rotate: 90 },
        { position: 'bottom-0 right-0', rotate: 180 },
        { position: 'bottom-0 left-0', rotate: 270 },
      ].map((corner, i) => (
        <div
          key={i}
          className={`absolute ${corner.position} w-8 h-8`}
          style={{ transform: `rotate(${corner.rotate}deg)` }}
        >
          <div className="absolute top-0 left-0 w-4 h-px bg-cyber-blue" />
          <div className="absolute top-0 left-0 w-px h-4 bg-cyber-blue" />
        </div>
      ))}
      
      {/* HUD Data */}
      <div className="absolute bottom-4 left-4 text-xs font-mono text-cyber-blue/60">
        <div>SCANNING...</div>
        <div>TARGETS: 5</div>
        <div>RANGE: 100M</div>
      </div>
      
      <div className="absolute top-4 right-4 text-xs font-mono text-cyber-blue/60">
        <div>SYS: ONLINE</div>
        <div>FPS: 30</div>
        <div>AI: ACTIVE</div>
      </div>
    </div>
  );
}
