import { useRef, useEffect } from 'react';

export const useAudioPlayer = (audioRef) => {
  const playPromiseRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Only set audio-specific properties if it's an Audio element
    if (audio instanceof HTMLAudioElement) {
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.volume = 1.0;
      
      const handleError = (e) => {
        console.error('Audio element error:', {
          error: e.target.error,
          currentSrc: e.target.currentSrc,
          readyState: e.target.readyState,
          paused: e.target.paused,
          currentTime: e.target.currentTime
        });
      };

      const handlePlay = () => {
        console.log('Audio element play event fired');
      };

      const handlePlaying = () => {
        console.log('Audio element is now playing');
        isPlayingRef.current = true;
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

      const handlePause = () => {
        console.log('Audio element paused');
        isPlayingRef.current = false;
      };

      // Add event listeners
      audio.addEventListener('error', handleError);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('playing', handlePlaying);
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('loadstart', handleLoadStart);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('pause', handlePause);

      return () => {
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('playing', handlePlaying);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('loadstart', handleLoadStart);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('pause', handlePause);
      };
    }
  }, [audioRef]);

  return {
    playPromiseRef,
    isPlayingRef
  };
};