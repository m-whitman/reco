import { useRef, useEffect } from 'react';

export const useAudioPlayer = (audioRef) => {
  const playPromiseRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    
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

    // Set up audio element
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.volume = 1.0;

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
  }, [audioRef]);

  return {
    playPromiseRef,
    isPlayingRef
  };
};