import { useRef, useCallback } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

export const useSpotifyPlayer = () => {
  const audioRef = useRef(new Audio());
  const { playPromiseRef, isPlayingRef } = useAudioPlayer(audioRef);

  const stop = useCallback(async () => {
    try {
      isPlayingRef.current = false;
      if (playPromiseRef.current) {
        await playPromiseRef.current;
      }
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
      await stop();
      audioRef.current.src = previewUrl;
      audioRef.current.currentTime = 0;
      
      playPromiseRef.current = audioRef.current.play();
      await playPromiseRef.current;
      isPlayingRef.current = true;
      playPromiseRef.current = null;
      return true;
    } catch (error) {
      console.error('Error playing Spotify preview:', error);
      isPlayingRef.current = false;
      playPromiseRef.current = null;
      return false;
    }
  }, [stop]);

  return { audioRef, play, stop };
};