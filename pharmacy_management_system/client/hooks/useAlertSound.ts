import { useRef, useCallback } from 'react';

export const useAlertSound = () => {
    const audioContext = useRef<AudioContext | null>(null);
    const oscillator = useRef<OscillatorNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);
    const isPlayingRef = useRef(false);

    const stop = useCallback(() => {
        if (oscillator.current) {
            try {
                oscillator.current.stop();
                oscillator.current.disconnect();
            } catch (e) {
                // Ignore errors if already stopped
            }
            oscillator.current = null;
        }
        if (gainNode.current) {
            gainNode.current.disconnect();
            gainNode.current = null;
        }
        if (audioContext.current) {
            audioContext.current.close();
            audioContext.current = null;
        }
        isPlayingRef.current = false;
    }, []);

    const play = useCallback(() => {
        if (isPlayingRef.current) return;

        try {
            // Create AudioContext only when needed (browsers block autoplay if created too early)
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContext.current = new AudioContextClass();

            // Create oscillator
            oscillator.current = audioContext.current.createOscillator();
            gainNode.current = audioContext.current.createGain();

            // Configure sound (High pitched beeping alarm)
            oscillator.current.type = 'square';
            oscillator.current.frequency.setValueAtTime(880, audioContext.current.currentTime); // A5

            // rhythmic beeping using gain
            // Beep every 0.5 seconds
            const now = audioContext.current.currentTime;
            gainNode.current.gain.setValueAtTime(0.1, now);

            // Schedule beeps
            // This simple version just plays a continuous tone modulated by gain to pulse it
            // 0.1s ON, 0.4s OFF
            for (let i = 0; i < 1000; i++) { // Schedule 1000 beeps (plenty of time)
                const startTime = now + i * 0.5;
                gainNode.current.gain.setValueAtTime(0.1, startTime);
                gainNode.current.gain.setValueAtTime(0.1, startTime + 0.1);
                gainNode.current.gain.setValueAtTime(0, startTime + 0.11);
            }

            oscillator.current.connect(gainNode.current);
            gainNode.current.connect(audioContext.current.destination);

            oscillator.current.start();
            isPlayingRef.current = true;
        } catch (error) {
            console.error("Failed to play alert sound:", error);
        }
    }, []);

    return { play, stop };
};
