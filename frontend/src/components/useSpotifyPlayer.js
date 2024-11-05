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
    console.log('10. Spotify player play called with URL:', previewUrl);
    if (!previewUrl) {
      console.error('11. No preview URL provided');
      return false;
    }
    
    try {
      console.log('12. Stopping previous playback');
      await stop();
      
      audioRef.current.src = previewUrl;
      audioRef.current.currentTime = 0;
      
      console.log('13. Starting new playback');
      playPromiseRef.current = audioRef.current.play();
      await playPromiseRef.current;
      console.log('14. Playback started successfully');
      isPlayingRef.current = true;
      playPromiseRef.current = null;
      return true;
    } catch (error) {
      console.error('15. Error playing Spotify preview:', error);
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