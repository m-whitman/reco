import { useRef, useCallback } from 'react';

export const useSpotifyPlayer = () => {
  const audioRef = useRef(new Audio());
  const playPromiseRef = useRef(null);
  const isPlayingRef = useRef(false);

  const stop = useCallback(async () => {
    try {
      isPlayingRef.current = false;
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      playPromiseRef.current = null;
      return true;
    } catch (error) {
      console.error("Error stopping Spotify preview:", error);
      return false;
    }
  }, []);

  const play = useCallback(async (previewUrl) => {
    if (!previewUrl) return false;
    
    try {
      // Ensure any previous playback is fully stopped
      await stop();
      
      audioRef.current.src = previewUrl;
      audioRef.current.currentTime = 0;
      
      playPromiseRef.current = audioRef.current.play();
      await playPromiseRef.current;
      isPlayingRef.current = true;
      playPromiseRef.current = null;
      return true;
    } catch (error) {
      console.error("Error playing Spotify preview:", error);
      isPlayingRef.current = false;
      playPromiseRef.current = null;
      return false;
    }
  }, [stop]);

  return {
    audioRef,
    playPromiseRef,
    isPlayingRef,
    play,
    stop
  };
};