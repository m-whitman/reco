import { useCallback } from 'react';

export const useAudioControls = ({
  currentSongRef,
  setCurrentSong,
  isPlaying,
  setIsPlaying,
  setProgress,
  setDuration
}, youtube, spotify) => {
  const stopCurrentSong = useCallback(async () => {
    const song = currentSongRef.current;
    if (!song) return;

    try {
      if (song.source === 'YouTube') {
        await youtube.stop();
      } else {
        spotify.stop();
      }
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
    } catch (error) {
      console.error("Error stopping current song:", error);
    }
  }, [youtube, spotify, currentSongRef, setIsPlaying, setProgress, setDuration]);

  const togglePlayPause = useCallback(async () => {
    const song = currentSongRef.current;
    if (!song) return;

    try {
      if (song.source === 'YouTube') {
        if (isPlaying) {
          await youtube.pause();
          setIsPlaying(false);
        } else {
          const success = await youtube.play(song.id);
          if (success) setIsPlaying(true);
        }
      } else {
        if (isPlaying) {
          spotify.pause();
          setIsPlaying(false);
        } else {
          const success = await spotify.play(song.previewUrl);
          if (success) setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
      setIsPlaying(false);
    }
  }, [isPlaying, youtube, spotify, currentSongRef, setIsPlaying]);

  const playSong = useCallback(async (song) => {
    if (!song) return;

    try {
      if (currentSongRef.current && currentSongRef.current.id === song.id) {
        await togglePlayPause();
        return;
      }

      await stopCurrentSong();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setCurrentSong(song);
      setProgress(0);
      setDuration(0);

      if (song.source === 'YouTube') {
        const success = await youtube.play(song.id);
        if (success) setIsPlaying(true);
      } else if (song.previewUrl) {
        const success = await spotify.play(song.previewUrl);
        if (success) setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing song:", error);
      setIsPlaying(false);
      setCurrentSong(null);
    }
  }, [youtube, spotify, currentSongRef, setCurrentSong, setIsPlaying, setProgress, setDuration, togglePlayPause, stopCurrentSong]);

  const seekTo = useCallback(async (percentage) => {
    const song = currentSongRef.current;
    if (!song) return;

    try {
      if (song.source === 'YouTube' && youtube.playerRef.current) {
        const newTime = (percentage / 100) * youtube.playerRef.current.getDuration();
        youtube.playerRef.current.seekTo(newTime);
        setProgress(percentage);
      } else if (song.source === 'Spotify' && spotify.audioRef.current) {
        const newTime = (percentage / 100) * spotify.audioRef.current.duration;
        spotify.audioRef.current.currentTime = newTime;
        setProgress(percentage);
      }
    } catch (error) {
      console.error("Error seeking:", error);
    }
  }, [currentSongRef, youtube.playerRef, spotify.audioRef, setProgress]);

  return {
    stopCurrentSong,
    togglePlayPause,
    playSong,
    seekTo
  };
};