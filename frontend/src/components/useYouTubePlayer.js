import { useRef, useCallback } from 'react';
import { useAudioPlayer } from './useAudioPlayer';

export const useYouTubePlayer = () => {
  const playerRef = useRef(null);
  const { isPlayingRef } = useAudioPlayer(playerRef);

  const play = useCallback(async (videoId) => {
    if (!playerRef.current) return false;
    
    try {
      if (videoId) {
        playerRef.current.loadVideoById(videoId);
      } else {
        playerRef.current.playVideo();
      }
      isPlayingRef.current = true;
      return true;
    } catch (error) {
      console.error('YouTube play error:', error);
      isPlayingRef.current = false;
      return false;
    }
  }, [isPlayingRef]);

  const stop = useCallback(async () => {
    if (!playerRef.current) return false;
    
    try {
      isPlayingRef.current = false;
      playerRef.current.stopVideo();
      return true;
    } catch (error) {
      console.error('YouTube stop error:', error);
      return false;
    }
  }, [isPlayingRef]);

  return { playerRef, play, stop };
};