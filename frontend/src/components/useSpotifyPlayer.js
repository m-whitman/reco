import { useRef, useCallback } from 'react';

export const useSpotifyPlayer = () => {
  const audioRef = useRef(new Audio());

  const play = useCallback(async (previewUrl) => {
    if (!previewUrl) return false;

    try {
      audioRef.current.src = previewUrl;
      await audioRef.current.play();
      return true;
    } catch (error) {
      console.error("Error playing Spotify preview:", error);
      return false;
    }
  }, []);

  const pause = useCallback(() => {
    try {
      audioRef.current.pause();
      return true;
    } catch (error) {
      console.error("Error pausing Spotify preview:", error);
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    try {
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

    audioRef.current.addEventListener('play', onPlay);
    audioRef.current.addEventListener('pause', onPause);
    audioRef.current.addEventListener('ended', onEnded);

    return () => {
      audioRef.current.removeEventListener('play', onPlay);
      audioRef.current.removeEventListener('pause', onPause);
      audioRef.current.removeEventListener('ended', onEnded);
    };
  }, []);

  return {
    audioRef,
    play,
    pause,
    stop,
    setupAudioListeners
  };
};