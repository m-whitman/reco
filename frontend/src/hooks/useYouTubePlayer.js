import { useRef, useCallback } from 'react';
import { isMobileDevice } from '../utils/deviceDetection';

export const useYouTubePlayer = () => {
  const playerRef = useRef(null);
  const stateHandlersRef = useRef({
    onStateChange: null
  });

  const setupEventHandlers = useCallback(({ onStateChange }) => {
    if (onStateChange) {
      stateHandlersRef.current.onStateChange = onStateChange;
    }
  }, []);

  const play = useCallback(async (videoId) => {
    const player = playerRef.current;
    if (!player) return false;
    
    try {
      if (videoId) {
        player.loadVideoById(videoId);
        return true;
      } else {
        player.playVideo();
        return true;
      }
    } catch (error) {
      console.error('YouTube play error:', error);
      return false;
    }
  }, []);

  const pause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return false;
    try {
      player.pauseVideo();
      return true;
    } catch (error) {
      console.error('YouTube pause error:', error);
      return false;
    }
  }, []);

  const stop = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return false;
    try {
      player.stopVideo();
      if (isMobileDevice()) {
        player.clearVideo();
      }
      return true;
    } catch (error) {
      console.error('YouTube stop error:', error);
      return false;
    }
  }, []);

  return {
    playerRef,
    play,
    pause,
    stop,
    setupEventHandlers
  };
};