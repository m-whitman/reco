import { useRef, useCallback, useEffect } from 'react';

export const useYouTubePlayer = () => {
  const playerRef = useRef(null);
  const stateHandlersRef = useRef({
    onReady: null,
    onStateChange: null,
    onError: null
  });

  const setupEventHandlers = useCallback(({ onReady, onStateChange, onError }) => {
    stateHandlersRef.current = {
      onReady,
      onStateChange,
      onError
    };
  }, []);

  useEffect(() => {
    // This function will be called by the YouTube IFrame API
    window.onYouTubePlayerStateChange = (event) => {
      if (stateHandlersRef.current.onStateChange) {
        stateHandlersRef.current.onStateChange(event);
      }
    };

    return () => {
      window.onYouTubePlayerStateChange = null;
    };
  }, []);

  const play = useCallback(async (videoId) => {
    const player = playerRef.current;
    if (!player) {
      return false;
    }
    try {
      if (videoId) {
        // Return a promise that resolves when the video is ready
        return new Promise((resolve) => {
          const onStateChange = (event) => {
            // YouTube states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            if (event.data === 1) { // Playing
              if (stateHandlersRef.current.onStateChange) {
                stateHandlersRef.current.onStateChange(event);
              }
              resolve(true);
            } else if (event.data === -1 || event.data === 3) { // Unstarted or Buffering
              // Wait for it to start playing
            } else {
              resolve(false);
            }
          };

          player.addEventListener('onStateChange', onStateChange);
          player.loadVideoById(videoId);
        });
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
    stop,
    setupEventHandlers
  };
};