import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  type?: 'light' | 'celebration' | 'success';
}

export default function Confetti({ trigger, type = 'light' }: ConfettiProps) {
  useEffect(() => {
    if (trigger) {
      // Light confetti - single burst, minimal particles
      if (type === 'light') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'],
          scalar: 0.8,
          gravity: 1.2
        });
      }
      // Success confetti - quick double burst
      else if (type === 'success') {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.7 }
          });
        }, 150);
      }
      // Celebration - triple burst
      else if (type === 'celebration') {
        const count = 3;
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            confetti({
              particleCount: 40,
              spread: 55 + i * 5,
              origin: { 
                y: 0.6,
                x: 0.3 + i * 0.2
              }
            });
          }, i * 100);
        }
      }
    }
  }, [trigger, type]);

  return null;
}

// Hook for programmatic confetti
export function useConfetti() {
  const fireSingle = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'],
      scalar: 0.8,
      gravity: 1.2
    });
  };

  const fireSuccess = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 }
      });
    }, 150);
  };

  return { fireSingle, fireSuccess };
}