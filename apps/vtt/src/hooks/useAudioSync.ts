import { useEffect, useRef } from 'react';
import type { AudioLiveState } from '../types/protocol.js';

/**
 * Synchronises client-side HTML5 Audio playback with the server's audio state.
 *
 * - When `audioState.playing` transitions to true → creates Audio and plays
 * - When `audioState.playing` transitions to false → pauses
 * - When `audioState` becomes null (stop) → stops and destroys Audio
 * - Handles looping, URL changes, and volume
 *
 * This hook is designed for the **player** view. The director controls playback
 * via the SceneAudioPanel / AudioPlayer which has its own local Audio element.
 */
export function useAudioSync(audioState: AudioLiveState | null, volume = 0.4) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // No audio state → stop everything
    if (!audioState) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null;
      }
      lastUrlRef.current = null;
      return;
    }

    const { playing, audioUrl, loop } = audioState;

    // If URL changed, swap audio element
    if (audioUrl && audioUrl !== lastUrlRef.current) {
      // Stop old audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }

      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.volume = volume;
      audio.loop = loop;
      audio.src = audioUrl;
      audioRef.current = audio;
      lastUrlRef.current = audioUrl;

      if (playing) {
        audio.play().catch(() => {
          // Autoplay may be blocked by browser policy
          // User interaction will be needed
        });
      }
      return;
    }

    // Same URL — just sync play/pause/loop
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = loop;
    audio.volume = volume;

    if (playing && audio.paused) {
      audio.play().catch(() => {});
    } else if (!playing && !audio.paused) {
      audio.pause();
    }
  }, [audioState, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, []);
}
