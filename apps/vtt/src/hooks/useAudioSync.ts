import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioLiveState } from '../types/protocol.js';

export interface AudioSyncOptions {
  volume?: number;
  muted?: boolean;
}

export interface AudioSyncStatus {
  playing: boolean;
  blocked: boolean;
  retry: () => void;
}

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
export function useAudioSync(audioState: AudioLiveState | null, options: AudioSyncOptions = {}): AudioSyncStatus {
  const { volume = 0.4, muted = false } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const retry = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setBlocked(false);
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => {
        setPlaying(false);
        setBlocked(true);
      });
  }, []);

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
      setPlaying(false);
      setBlocked(false);
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
      audio.volume = muted ? 0 : volume;
      audio.loop = loop;
      audio.src = audioUrl;
      audioRef.current = audio;
      lastUrlRef.current = audioUrl;

      if (playing) {
        retry();
      } else {
        setPlaying(false);
        setBlocked(false);
      }
      return;
    }

    // Same URL — just sync play/pause/loop
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = loop;
    audio.volume = muted ? 0 : volume;

    if (playing && audio.paused) {
      retry();
    } else if (!playing && !audio.paused) {
      audio.pause();
      setPlaying(false);
      setBlocked(false);
    }
  }, [audioState, volume, muted, retry]);

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

  return { playing, blocked, retry };
}
