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

      const handleStateChange = () => {
        console.log('Audio state:', {
          currentTime: audio.currentTime,
          duration: audio.duration,
          ended: audio.ended,
          paused: audio.paused,
          readyState: audio.readyState,
          volume: audio.volume
        });
      };

      // Add event listeners
      audio.addEventListener('error', handleError);
      audio.addEventListener('play', handleStateChange);
      audio.addEventListener('pause', handleStateChange);
      audio.addEventListener('ended', handleStateChange);
      audio.addEventListener('timeupdate', handleStateChange);

      return () => {
        audio.removeEventListener('error', handleError);
        audio.removeEventListener('play', handleStateChange);
        audio.removeEventListener('pause', handleStateChange);
        audio.removeEventListener('ended', handleStateChange);
        audio.removeEventListener('timeupdate', handleStateChange);
      };
    }
  }, [audioRef]);

  return {
    playPromiseRef,
    isPlayingRef
  };
};