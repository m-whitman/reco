import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { useYouTubePlayer } from './useYouTubePlayer';
import { useSpotifyPlayer } from './useSpotifyPlayer';
import { useAudioStorage } from './useAudioStorage';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('favorites');
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });
  
  const youtube = useYouTubePlayer();
  const spotify = useSpotifyPlayer();
  const storage = useAudioStorage();
  const progressInterval = useRef(null);

  // Keep track of the latest song state without triggering re-renders
  const currentSongRef = useRef(currentSong);
  currentSongRef.current = currentSong;

  // Set up progress tracking
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

  // Set up audio duration listener for Spotify
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

  // Set up Spotify audio event listeners
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
  }, [youtube, spotify]);

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
  }, [isPlaying, youtube, spotify]);

  const playSong = useCallback(async (song) => {
    if (!song) return;

    try {
      // If trying to play the same song, just toggle play/pause
      if (currentSongRef.current && currentSongRef.current.id === song.id) {
        await togglePlayPause();
        return;
      }

      // Stop current song first and wait a moment
      await stopCurrentSong();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update current song state
      setCurrentSong(song);
      setProgress(0);
      setDuration(0);
      
      // Play the new song
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
  }, [youtube, spotify, stopCurrentSong, togglePlayPause]);

  const toggleFavorite = useCallback((song) => {
    setFavorites(prevFavorites => {
      const isFavorited = prevFavorites.some(fav => fav.id === song.id);
      let newFavorites;
      
      if (isFavorited) {
        newFavorites = prevFavorites.filter(fav => fav.id !== song.id);
      } else {
        newFavorites = [...prevFavorites, song];
      }
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((song) => {
    return favorites.some(fav => fav.id === song.id);
  }, [favorites]);

  const playNext = useCallback(async () => {
    if (queueIndex < queue.length - 1) {
      await stopCurrentSong();
      const nextTrack = queue[queueIndex + 1];
      setQueueIndex(queueIndex + 1);
      await playSong(nextTrack);
    }
  }, [queueIndex, queue, stopCurrentSong, playSong]);

  const playPrevious = useCallback(async () => {
    if (queueIndex > 0) {
      await stopCurrentSong();
      const previousTrack = queue[queueIndex - 1];
      setQueueIndex(queueIndex - 1);
      await playSong(previousTrack);
    }
  }, [queueIndex, queue, stopCurrentSong, playSong]);

  const updateQueue = useCallback((tracks, currentTrack) => {
    setQueue(tracks);
    setQueueIndex(tracks.findIndex(track => track.id === currentTrack.id));
  }, []);

  const handleYouTubeStateChange = useCallback((state) => {
    const song = currentSongRef.current;
    if (song?.source === 'YouTube') {
      if (state === 0) { // Video ended
        if (queueIndex < queue.length - 1) {
          playNext();
        } else {
          setIsPlaying(false);
          setCurrentSong(null);
          setProgress(0);
          setDuration(0);
        }
      } else if (state === 1) { // Playing
        setIsPlaying(true);
        if (youtube.playerRef.current) {
          setDuration(youtube.playerRef.current.getDuration());
        }
      } else if (state === 2) { // Paused
        setIsPlaying(false);
      }
    }
  }, [queueIndex, queue, playNext, youtube.playerRef]);

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

export default AudioProvider;