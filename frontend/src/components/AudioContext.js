import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { useYouTubePlayer } from './useYouTubePlayer';
import { useSpotifyPlayer } from './useSpotifyPlayer';
import { useAudioStorage } from './useAudioStorage';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    const stored = localStorage.getItem('favorites');
    return stored ? JSON.parse(stored) : [];
  });

  const youtube = useYouTubePlayer();
  const spotify = useSpotifyPlayer();
  const storage = useAudioStorage();
  const progressInterval = useRef(null);
  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;

  // Progress tracking effect
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
  }, [isPlaying, currentSong, youtube.playerRef, spotify.audioRef]);

  // Spotify metadata listener
  useEffect(() => {
    const handleLoadedMetadata = () => {
      if (currentSong?.source === 'Spotify') {
        setDuration(spotify.audioRef.current.duration);
      }
    };

    spotify.audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      spotify.audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentSong, spotify.audioRef]);

  // Setup Spotify listeners
  spotify.setupAudioListeners({
    onPlay: () => {
      setIsPlaying(true);
      if (!isNaN(spotify.audioRef.current.duration)) {
        setDuration(spotify.audioRef.current.duration);
      }
    },
    onPause: () => setIsPlaying(false),
    onEnded: async () => {
      if (queueIndex < queue.length - 1) {
        await playNext();
      } else {
        setIsPlaying(false);
        setCurrentSong(null);
        setProgress(0);
        setDuration(0);
      }
    }
  });

  const stopCurrentSong = useCallback(async () => {
    if (!currentSong) return;

    try {
      if (currentSong.source === 'YouTube') {
        await youtube.stop();
      } else if (currentSong.source === 'Spotify') {
        await spotify.stop();
      }
      setIsPlaying(false);
    } catch (error) {
      console.error("Error stopping current song:", error);
    }
  }, [currentSong, youtube, spotify]);

  const playSong = useCallback(async (song) => {
    if (!song) return;

    try {
      // Stop current playback if any
      await stopCurrentSong();

      // Set the new current song
      setCurrentSong(song);
      setProgress(0);
      setDuration(0);

      // Start playback based on source
      let playbackSuccess = false;
      if (song.source === 'YouTube') {
        playbackSuccess = await youtube.play(song.id);
      } else if (song.source === 'Spotify') {
        playbackSuccess = await spotify.play(song.previewUrl);
      }

      setIsPlaying(playbackSuccess);
    } catch (error) {
      console.error("Error playing song:", error);
      setIsPlaying(false);
    }
  }, [stopCurrentSong, youtube, spotify]);

  const togglePlayPause = useCallback(async () => {
    if (!currentSong) return;

    try {
      if (isPlaying) {
        if (currentSong.source === 'YouTube') {
          await youtube.stop();
        } else if (currentSong.source === 'Spotify') {
          await spotify.pause();
        }
        setIsPlaying(false);
      } else {
        let playbackSuccess = false;
        if (currentSong.source === 'YouTube') {
          playbackSuccess = await youtube.play();
        } else if (currentSong.source === 'Spotify') {
          playbackSuccess = await spotify.play(currentSong.previewUrl);
        }
        setIsPlaying(playbackSuccess);
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  }, [currentSong, isPlaying, youtube, spotify]);

  const updateQueue = useCallback((tracks, currentTrack) => {
    setQueue(tracks);
    setQueueIndex(tracks.findIndex(track => track.id === currentTrack.id));
  }, []);

  const playNext = useCallback(async () => {
    if (queueIndex < queue.length - 1) {
      const nextTrack = queue[queueIndex + 1];
      setQueueIndex(queueIndex + 1);
      await playSong(nextTrack);
    }
  }, [queueIndex, queue, playSong]);

  const playPrevious = useCallback(async () => {
    if (queueIndex > 0) {
      const previousTrack = queue[queueIndex - 1];
      setQueueIndex(queueIndex - 1);
      await playSong(previousTrack);
    }
  }, [queueIndex, queue, playSong]);

  const seekTo = useCallback(async (percentage) => {
    if (!currentSong) return;

    try {
      if (currentSong.source === 'YouTube' && youtube.playerRef.current) {
        const newTime = (percentage / 100) * youtube.playerRef.current.getDuration();
        youtube.playerRef.current.seekTo(newTime);
        setProgress(percentage);
      } else if (currentSong.source === 'Spotify' && spotify.audioRef.current) {
        const newTime = (percentage / 100) * spotify.audioRef.current.duration;
        spotify.audioRef.current.currentTime = newTime;
        setProgress(percentage);
      }
    } catch (error) {
      console.error("Error seeking:", error);
    }
  }, [currentSong, youtube.playerRef, spotify.audioRef]);

  const toggleFavorite = useCallback((song) => {
    setFavorites(prevFavorites => {
      const isFavorited = prevFavorites.some(fav => fav.id === song.id);
      const newFavorites = isFavorited
        ? prevFavorites.filter(fav => fav.id !== song.id)
        : [...prevFavorites, song];
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((songId) => {
    return favorites.some(fav => fav.id === songId);
  }, [favorites]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSongRef.current) {
        if (currentSongRef.current.source === 'YouTube') {
          youtube.stop();
        } else {
          spotify.stop();
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [youtube, spotify]);

  const handleYouTubeStateChange = useCallback((isPlaying) => {
    setIsPlaying(isPlaying);
  }, []);

  return (
    <AudioContext.Provider value={{ 
      currentSong,
      isPlaying,
      progress,
      duration,
      playSong,
      seekTo,
      togglePlayPause,
      playNext,
      playPrevious,
      updateQueue,
      hasNext: queueIndex < queue.length - 1,
      hasPrevious: queueIndex > 0,
      favorites,
      toggleFavorite,
      isFavorite,
      youtubePlayerRef: youtube.playerRef,
      setIsPlaying: handleYouTubeStateChange,
      stopCurrentSong,
      ...storage,
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};