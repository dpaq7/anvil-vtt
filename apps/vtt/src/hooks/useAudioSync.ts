import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioLiveState } from '../types/protocol.js';
import { credentialedMediaCrossOrigin, resolveApiUrl } from '../lib/api-url.js';

export type AudioPlaybackStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'blocked'
  | 'error';

export interface AudioSyncPlayback {
  status: AudioPlaybackStatus;
  error: string | null;
  needsUserGesture: boolean;
  retryPlayback: () => Promise<boolean>;
}

export interface AudioSyncOptions {
  volume?: number;
  muted?: boolean;
}

const IDLE_PLAYBACK: Omit<AudioSyncPlayback, 'retryPlayback'> = {
  status: 'idle',
  error: null,
  needsUserGesture: false,
};

function describePlaybackFailure(error: unknown): Omit<AudioSyncPlayback, 'retryPlayback'> {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return {
        status: 'blocked',
        error: 'Click to enable scene audio.',
        needsUserGesture: true,
      };
    }

    if (error.name === 'NotSupportedError') {
      return {
        status: 'error',
        error: 'This browser cannot play the selected audio format.',
        needsUserGesture: false,
      };
    }
  }

  return {
    status: 'error',
    error: 'Scene audio could not be played.',
    needsUserGesture: false,
  };
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
export function useAudioSync(
  audioState: AudioLiveState | null,
  options: number | AudioSyncOptions = 0.4,
): AudioSyncPlayback {
  const volume = typeof options === 'number' ? options : options.volume ?? 0.4;
  const muted = typeof options === 'number' ? false : options.muted ?? false;
  const outputVolume = muted ? 0 : volume;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const cleanupListenersRef = useRef<(() => void) | null>(null);
  const audioStateRef = useRef(audioState);
  const volumeRef = useRef(outputVolume);
  const [playback, setPlayback] = useState<Omit<AudioSyncPlayback, 'retryPlayback'>>(IDLE_PLAYBACK);

  audioStateRef.current = audioState;
  volumeRef.current = outputVolume;

  const disposeAudio = useCallback(() => {
    cleanupListenersRef.current?.();
    cleanupListenersRef.current = null;

    const audio = audioRef.current;
    audioRef.current = null;
    lastUrlRef.current = null;

    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }, []);

  const attachAudio = useCallback((audioUrl: string, loop: boolean) => {
    disposeAudio();

    const audio = new Audio();
    const crossOrigin = credentialedMediaCrossOrigin(audioUrl);
    if (crossOrigin) audio.crossOrigin = crossOrigin;
    audio.preload = 'auto';
    audio.volume = volumeRef.current;
    audio.loop = loop;

    const isCurrentAudio = () => audioRef.current === audio;
    const onPlaying = () => {
      if (!isCurrentAudio()) return;
      setPlayback({ status: 'playing', error: null, needsUserGesture: false });
    };
    const onCanPlay = () => {
      if (!isCurrentAudio() || audioStateRef.current?.playing || !audio.paused) return;
      setPlayback({ status: 'paused', error: null, needsUserGesture: false });
    };
    const onPause = () => {
      if (!isCurrentAudio() || !audioStateRef.current) return;
      setPlayback({ status: 'paused', error: null, needsUserGesture: false });
    };
    const onEnded = () => {
      if (!isCurrentAudio() || audio.loop) return;
      setPlayback({ status: 'paused', error: null, needsUserGesture: false });
    };
    const onError = () => {
      if (!isCurrentAudio()) return;
      setPlayback({
        status: 'error',
        error: 'This browser could not load the selected audio.',
        needsUserGesture: false,
      });
    };

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    cleanupListenersRef.current = () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };

    audio.src = audioUrl;
    audioRef.current = audio;
    lastUrlRef.current = audioUrl;
    return audio;
  }, [disposeAudio]);

  const retryPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    const currentAudio = audio;
    setPlayback({ status: 'loading', error: null, needsUserGesture: false });

    try {
      await currentAudio.play();
      if (audioRef.current !== currentAudio) return false;
      setPlayback({ status: 'playing', error: null, needsUserGesture: false });
      return true;
    } catch (error) {
      if (audioRef.current !== currentAudio) return false;
      if (error instanceof DOMException && error.name === 'AbortError') return false;
      setPlayback(describePlaybackFailure(error));
      return false;
    }
  }, []);

  useEffect(() => {
    // No audio state → stop everything
    if (!audioState) {
      disposeAudio();
      setPlayback(IDLE_PLAYBACK);
      return;
    }

    const { playing, loop } = audioState;
    const audioUrl = audioState.audioUrl ? resolveApiUrl(audioState.audioUrl) : null;
    if (!audioUrl) {
      disposeAudio();
      setPlayback(
        playing
          ? {
              status: 'error',
              error: 'Scene audio has no playable source.',
              needsUserGesture: false,
            }
          : IDLE_PLAYBACK,
      );
      return;
    }

    // If URL changed, swap audio element
    if (audioUrl !== lastUrlRef.current) {
      attachAudio(audioUrl, loop);
    }

    // Same URL — just sync play/pause/loop
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = loop;
    audio.volume = outputVolume;

    if (playing && audio.paused) {
      void retryPlayback();
    } else if (!playing && !audio.paused) {
      audio.pause();
      setPlayback({ status: 'paused', error: null, needsUserGesture: false });
    } else if (!playing) {
      setPlayback({ status: 'paused', error: null, needsUserGesture: false });
    }
  }, [attachAudio, audioState, disposeAudio, outputVolume, retryPlayback]);

  // Cleanup on unmount
  useEffect(() => {
    return disposeAudio;
  }, [disposeAudio]);

  return { ...playback, retryPlayback };
}
