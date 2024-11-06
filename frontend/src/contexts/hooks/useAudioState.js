import { useState, useRef } from 'react';

export const useAudioState = () => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;

  return {
    currentSong,
    setCurrentSong,
    isPlaying,
    setIsPlaying,
    progress,
    setProgress,
    duration,
    setDuration,
    currentSongRef
  };
};