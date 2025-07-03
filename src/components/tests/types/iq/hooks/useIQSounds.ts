/**
 * Hook cung cấp chức năng phát âm thanh cho IQ test
 */
import { useState, useCallback } from 'react';

export function useIQSounds() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  // Lấy hoặc tạo audio context
  const getAudioContext = useCallback(() => {
    let ctx = audioContext;
    if (!ctx) {
      console.log('🔊 Creating audio context on-demand...');
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx); // Update state for future calls
        console.log('🎵 Audio context created:', ctx.state);
      } catch (error) {
        console.error('❌ Failed to create audio context:', error);
        return null;
      }
    }

    // Resume context if suspended
    if (ctx.state === 'suspended') {
      console.log('🔊 Resuming suspended audio context...');
      ctx.resume();
    }

    return ctx;
  }, [audioContext]);
  
  // Phát âm thanh
  const playSound = useCallback((type: 'correct' | 'wrong' | 'warning' | 'complete') => {
    console.log(`🔊 playSound called with type: ${type}`);
    
    // ✅ SMART: Create audio context on-demand if not exists
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      if (type === 'complete') {
        // ✅ SPECIAL: Celebration sound sequence
        playCelebrationSound(ctx);
      } else if (type === 'warning') {
        // ✅ IMPROVED: Alarm bell sound for time up
        playAlarmSound(ctx);
      } else {
        // Normal single tone sounds
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        const configs = {
          correct: { frequency: 800, duration: 0.15, type: 'sine' as OscillatorType },
          wrong: { frequency: 800, duration: 0.15, type: 'sine' as OscillatorType },
          warning: { frequency: 600, duration: 0.3, type: 'triangle' as OscillatorType },
          complete: { frequency: 1000, duration: 0.4, type: 'sine' as OscillatorType }
        };
        
        const config = configs[type];
        console.log(`🔊 Playing ${type} sound:`, config);
        
        oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
        oscillator.type = config.type;
        
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + config.duration);
      }
      
      console.log('✅ Sound should be playing now');
      
    } catch (error) {
      console.error('❌ Error playing sound:', error);
    }
  }, [getAudioContext]);

  // ✅ COUNTDOWN: Âm thanh tít cho đếm ngược 10 giây cuối
  const playTickSound = useCallback(() => {
    console.log('⏱️ Playing tick sound for countdown');
    
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Tần số cao và rõ ràng hơn cho âm thanh tít cảnh báo
      oscillator.frequency.setValueAtTime(2000, ctx.currentTime);
      oscillator.type = 'square';
      
      // Âm thanh to hơn và rõ ràng hơn
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (error) {
      console.error('❌ Error playing tick sound:', error);
    }
  }, [getAudioContext]);

  // ✅ CELEBRATION: Special multi-tone success sound
  const playCelebrationSound = useCallback((ctx: AudioContext) => {
    console.log('🎉 Playing celebration sound sequence!');
    
    // Victory melody: C-E-G-C (Do-Mi-Sol-Do) in higher octave
    const melody = [
      { freq: 523, duration: 0.2 }, // C5
      { freq: 659, duration: 0.2 }, // E5
      { freq: 784, duration: 0.2 }, // G5
      { freq: 1047, duration: 0.4 } // C6
    ];
    
    let startTime = ctx.currentTime;
    
    melody.forEach((note, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, startTime);
      oscillator.type = 'sine';
      
      // Volume envelope for musical effect
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration);
      
      startTime += note.duration * 0.8; // Slight overlap for smooth transition
    });
  }, []);

  // ✅ ALARM: Chuông báo động khi hết thời gian
  const playAlarmSound = useCallback((ctx: AudioContext) => {
    console.log('🚨 Playing alarm bell sound!');
    
    // Chuỗi âm thanh báo động: cao-thấp-cao-thấp
    const alarmSequence = [
      { freq: 880, duration: 0.3 }, // A5 - cao
      { freq: 440, duration: 0.3 }, // A4 - thấp
      { freq: 880, duration: 0.3 }, // A5 - cao
      { freq: 440, duration: 0.3 }  // A4 - thấp
    ];
    
    let startTime = ctx.currentTime;
    
    alarmSequence.forEach((note, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, startTime);
      oscillator.type = 'square'; // Âm thanh sắc nét hơn cho cảnh báo
      
      // Âm lượng lớn hơn cho cảnh báo
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + note.duration);
      
      startTime += note.duration * 0.9; // Khoảng cách ngắn giữa các âm
    });
  }, []);

  return {
    playSound,
    playTickSound
  };
} 