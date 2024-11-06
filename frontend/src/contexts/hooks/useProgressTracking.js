import { useEffect, useRef } from 'react';

export const useProgressTracking = (
  { currentSong, isPlaying, setProgress, setDuration },
  youtube,
  spotify
) => {
  const progressInterval = useRef(null);

  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    if (isPlaying && currentSong) {
      progressInterval.current = setInterval(() => {
        if (currentSong.source === 'YouTube' && youtube.playerRef.current) {
          const currentTime = youtube.playerRef.current.getCurrentTime();
          const totalDuration = youtube.playerRef.current.getDuration();
          setProgress((currentTime / totalDuration) * 100);
          setDuration(totalDuration);
        } else if (currentSong.source === 'Spotify' && spotify.audioRef.current) {
          const currentTime = spotify.audioRef.current.currentTime;
          const totalDuration = spotify.audioRef.current.duration;
          if (!isNaN(totalDuration)) {
            setProgress((currentTime / totalDuration) * 100);
            setDuration(totalDuration);
          }
        }
      }, 1000);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, currentSong, youtube.playerRef, spotify.audioRef, setProgress, setDuration]);

  return { progressInterval };
};