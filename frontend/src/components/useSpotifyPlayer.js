import { useRef, useCallback } from 'react';

export const useSpotifyPlayer = () => {
  const audioRef = useRef(new Audio());
  const playPromiseRef = useRef(null);

  const play = useCallback(async (previewUrl) => {
    if (!previewUrl) return false;
    
    try {
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }

      if (audioRef.current.src !== previewUrl) {
        audioRef.current.src = previewUrl;
        audioRef.current.currentTime = 0;
      }

      playPromiseRef.current = audioRef.current.play();
      await playPromiseRef.current;
      playPromiseRef.current = null;
      return true;
    } catch (error) {
      console.error("Error playing Spotify preview:", error);
      playPromiseRef.current = null;
      return false;
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }
      audioRef.current.pause();
      return true;
    } catch (error) {
      console.error("Error pausing Spotify preview:", error);
      return false;
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      return true;
    } catch (error) {
      console.error("Error stopping Spotify preview:", error);
      return false;
    }
  }, []);

  const setupAudioListeners = useCallback((handlers) => {
    const { onPlay, onPause, onEnded } = handlers;
    
    const cleanup = () => {
      audioRef.current.removeEventListener('play', onPlay);
      audioRef.current.removeEventListener('pause', onPause);
      audioRef.current.removeEventListener('ended', onEnded);
    };

    cleanup();
    
    audioRef.current.addEventListener('play', onPlay);
    audioRef.current.addEventListener('pause', onPause);
    audioRef.current.addEventListener('ended', onEnded);

    return cleanup;
  }, []);

  return {
    audioRef,
    play,
    pause,
    stop,
    setupAudioListeners
  };
};