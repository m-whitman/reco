import { useRef, useCallback, useEffect } from 'react';

export const useSpotifyPlayer = () => {
  const audioRef = useRef(new Audio());
  const playPromiseRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;

    const handleError = (e) => {
      console.error('Audio element error:', e);
    };

    const handlePlay = () => {
      console.log('Audio element play event fired');
    };

    const handlePlaying = () => {
      console.log('Audio element is now playing');
    };

    const handleWaiting = () => {
      console.log('Audio element is waiting for data');
    };

    const handleLoadStart = () => {
      console.log('Audio element started loading:', audio.src);
    };

    const handleCanPlay = () => {
      console.log('Audio element can play');
      console.log('Duration:', audio.duration);
      console.log('Ready state:', audio.readyState);
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    // Also set some basic properties
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";

    return () => {
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

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
      
      console.log('Current volume:', audioRef.current.volume);
      audioRef.current.volume = 1.0;
      console.log('Volume after setting:', audioRef.current.volume);
      
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