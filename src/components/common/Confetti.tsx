import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
}

export default function Confetti({ 
  trigger, 
  duration = 3000, 
  particleCount = 100, 
  spread = 70,
  origin = { y: 0.6 }
}: ConfettiProps) {
  useEffect(() => {
    if (trigger) {
      const end = Date.now() + duration;

      const interval = setInterval(() => {
        confetti({
          particleCount,
          spread,
          origin
        });

        if (Date.now() > end) {
          clearInterval(interval);
        }
      }, 150);

      return () => clearInterval(interval);
    }
  }, [trigger, duration, particleCount, spread, origin]);

  return null;
}

export function useConfetti() {
  const fireMultipleBursts = (type: 'celebration' | 'success' | 'achievement' = 'celebration') => {
    const configs = {
      celebration: [
        { particleCount: 50, spread: 60, origin: { y: 0.6 } },
        { particleCount: 50, spread: 60, origin: { y: 0.6, x: 0.2 } },
        { particleCount: 50, spread: 60, origin: { y: 0.6, x: 0.8 } }
      ],
      success: [
        { particleCount: 100, spread: 70, origin: { y: 0.6 } }
      ],
      achievement: [
        { particleCount: 150, spread: 90, origin: { y: 0.4 } },
        { particleCount: 100, spread: 50, origin: { y: 0.7 } }
      ]
    };

    configs[type].forEach((config, index) => {
      setTimeout(() => confetti(config), index * 100);
    });
  };

  const fireSingle = (config?: any) => {
    confetti(config || { particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  return { fireMultipleBursts, fireSingle };
}