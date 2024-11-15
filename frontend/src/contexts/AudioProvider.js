import React from 'react';
import AudioContext from './AudioContext';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { useAudioStorage } from '../hooks/useAudioStorage';
import { useAudioState } from './hooks/useAudioState';
import { useQueueState } from './hooks/useQueueState';
import { useFavoritesState } from './hooks/useFavoriteState';
import { useProgressTracking } from './hooks/useProgressTracking';
import { useAudioControls } from './hooks/useAudioControls';

export const AudioProvider = ({ children }) => {
  const audioState = useAudioState();
  const queueState = useQueueState();
  const favoritesState = useFavoritesState();
  
  const youtube = useYouTubePlayer();
  const spotify = useSpotifyPlayer();
  const storage = useAudioStorage();

  const audioControls = useAudioControls(audioState, youtube, spotify);
  useProgressTracking(audioState, youtube, spotify);

  // Set up Spotify audio event listeners
  React.useEffect(() => {
    const cleanup = spotify.setupAudioListeners({
      onPlay: () => {
        audioState.setIsPlaying(true);
        if (!isNaN(spotify.audioRef.current.duration)) {
          audioState.setDuration(spotify.audioRef.current.duration);
        }
      },
      onPause: () => audioState.setIsPlaying(false),
      onEnded: async () => {
        if (queueState.hasNext) {
          const nextTrack = await queueState.playNext();
          if (nextTrack) {
            await audioControls.playSong(nextTrack);
          }
        } else {
          audioState.setIsPlaying(false);
          audioState.setCurrentSong(null);
          audioState.setProgress(0);
          audioState.setDuration(0);
        }
      }
    });

    return cleanup;
  }, [spotify, audioState, queueState]);

  // Add YouTube event handlers
  React.useEffect(() => {
    const handleYouTubeStateChange = async (event) => {
      // YouTube states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
      switch (event.data) {
        case 0: // ended
          if (queueState.hasNext) {
            const nextTrack = await queueState.playNext();
            if (nextTrack) {
              await audioControls.playSong(nextTrack);
            }
          } else {
            audioState.setIsPlaying(false);
            audioState.setCurrentSong(null);
            audioState.setProgress(0);
            audioState.setDuration(0);
          }
          break;
        case 1: // playing
          audioState.setIsPlaying(true);
          break;
        case 2: // paused
          audioState.setIsPlaying(false);
          break;
        case 3: // buffering
          // Do nothing while buffering
          break;
        default:
          // Handle any other states (-1: unstarted, 5: video cued)
          break;
      }
    };

    if (youtube.playerRef.current && youtube.playerRef.current.addEventListener) {
      try {
        youtube.playerRef.current.addEventListener('onStateChange', handleYouTubeStateChange);
      } catch (error) {
        console.warn('Error adding YouTube event listener:', error);
      }
    }

    return () => {
      if (youtube.playerRef.current && youtube.playerRef.current.removeEventListener) {
        try {
          youtube.playerRef.current.removeEventListener('onStateChange', handleYouTubeStateChange);
        } catch (error) {
          console.warn('Error removing YouTube event listener:', error);
        }
      }
    };
  }, [youtube.playerRef, audioState, queueState, audioControls]);

  const handlePlayNext = async () => {
    const nextTrack = await queueState.playNext();
    if (nextTrack) {
      await audioControls.playSong(nextTrack);
    }
  };

  const handlePlayPrevious = async () => {
    const previousTrack = await queueState.playPrevious();
    if (previousTrack) {
      await audioControls.playSong(previousTrack);
    }
  };

  const contextValue = {
    ...audioState,
    ...audioControls,
    ...queueState,
    ...favoritesState,
    youtubePlayerRef: youtube.playerRef,
    ...storage,
    playNext: handlePlayNext,
    playPrevious: handlePlayPrevious
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};