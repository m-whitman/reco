import { useRef, useCallback } from 'react';

export const useYouTubePlayer = () => {
  const playerRef = useRef(null);

  const play = useCallback((videoId) => {
    const player = playerRef.current;
    if (!player) {
      return false;
    }
    try {
      if (videoId) {
        player.loadVideoById(videoId);
      } else {
        player.playVideo();
      }
      return true;
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

  const stop = useCallback(() => {
    const player = playerRef.current;
    if (!player) return false;
    try {
      player.stopVideo();
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
    stop
  };
};