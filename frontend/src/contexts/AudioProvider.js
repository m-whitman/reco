import React from 'react';
import AudioContext from './AudioContext';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { useAudioStorage } from '../hooks/useAudioStorage';
import { useAudioState } from './hooks/useAudioState';
import { useQueueState } from './hooks/useQueueState';
import { useFavoritesState } from './hooks/useFavoritesState';
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
          await queueState.playNext();
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

  const contextValue = {
    ...audioState,
    ...audioControls,
    ...queueState,
    ...favoritesState,
    youtubePlayerRef: youtube.playerRef,
    ...storage,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};