import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  shapes?: ('square' | 'circle')[];
  onComplete?: () => void;
}

export default function Confetti({
  trigger,
  duration = 3000,
  particleCount = 100,
  spread = 70,
  origin = { x: 0.5, y: 0.5 },
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
  shapes = ['square', 'circle'],
  onComplete
}: ConfettiProps) {

  useEffect(() => {
    if (!trigger) return;

    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 30, 
      spread, 
      ticks: 60, 
      zIndex: 0,
      colors,
      shapes
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function frame() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        onComplete?.();
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Burst from center
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });

      requestAnimationFrame(frame);
    }

    // Initial big burst
    confetti({
      ...defaults,
      particleCount: particleCount * 2,
      spread: spread + 20,
      origin
    });

    // Continuous smaller bursts
    setTimeout(() => {
      frame();
    }, 250);

  }, [trigger, duration, particleCount, spread, origin, colors, shapes, onComplete]);

  return null;
}

// Predefined confetti presets
export const ConfettiPresets = {
  celebration: {
    duration: 5000,
    particleCount: 150,
    spread: 100,
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57']
  },
  
  success: {
    duration: 3000,
    particleCount: 100,
    spread: 70,
    colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0']
  },
  
  achievement: {
    duration: 4000,
    particleCount: 200,
    spread: 90,
    colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF7F50']
  },

  gentle: {
    duration: 2000,
    particleCount: 50,
    spread: 50,
    colors: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8']
  }
};

// Hook for easy confetti triggering
export function useConfetti() {
  const fireConfetti = (preset: keyof typeof ConfettiPresets = 'celebration') => {
    const config = ConfettiPresets[preset];
    
    confetti({
      particleCount: config.particleCount,
      spread: config.spread,
      origin: { y: 0.6 },
      colors: config.colors,
      startVelocity: 30,
      gravity: 0.8,
      drift: 0,
      ticks: 200,
      scalar: 1.2,
      shapes: ['square', 'circle']
    });
  };

  const fireMultipleBursts = (preset: keyof typeof ConfettiPresets = 'celebration') => {
    const config = ConfettiPresets[preset];
    
    // Left side
    setTimeout(() => {
      confetti({
        particleCount: config.particleCount / 3,
        spread: config.spread,
        origin: { x: 0.2, y: 0.6 },
        colors: config.colors
      });
    }, 0);
    
    // Center
    setTimeout(() => {
      confetti({
        particleCount: config.particleCount / 2,
        spread: config.spread + 20,
        origin: { x: 0.5, y: 0.6 },
        colors: config.colors
      });
    }, 300);
    
    // Right side
    setTimeout(() => {
      confetti({
        particleCount: config.particleCount / 3,
        spread: config.spread,
        origin: { x: 0.8, y: 0.6 },
        colors: config.colors
      });
    }, 600);
  };

  return { fireConfetti, fireMultipleBursts };
}