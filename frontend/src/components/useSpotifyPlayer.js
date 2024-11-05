import { useRef, useCallback } from 'react';
import { useAudioPlayer } from './useAudioPlayer';

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
  }, [isPlayingRef, playPromiseRef]);

  const play = useCallback(async (previewUrl) => {
    if (!previewUrl) return false;
    
    try {
      await stop();
      
      // Reset audio element
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = "anonymous";
      audioRef.current.preload = "auto";
      audioRef.current.volume = 1.0;
      audioRef.current.src = previewUrl;
      
      // Wait for audio to be ready
      await new Promise((resolve) => {
        const canPlayHandler = () => {
          audioRef.current.removeEventListener('canplay', canPlayHandler);
          resolve();
        };
        audioRef.current.addEventListener('canplay', canPlayHandler);
      });
      
      // Start playback
      playPromiseRef.current = audioRef.current.play();
      await playPromiseRef.current;
      isPlayingRef.current = true;
      
      // Add ended handler
      audioRef.current.addEventListener('ended', () => {
        isPlayingRef.current = false;
        playPromiseRef.current = null;
      });
      
      return true;
    } catch (error) {
      console.error('Error playing Spotify preview:', error);
      isPlayingRef.current = false;
      playPromiseRef.current = null;
      return false;
    }
  }, [stop, isPlayingRef, playPromiseRef]);

  return { audioRef, play, stop };
};