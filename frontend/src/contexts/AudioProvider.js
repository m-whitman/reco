import React from 'react';
import AudioContext from './AudioContext';
import { useAudioState } from './hooks/useAudioState';
import { useQueueState } from './hooks/useQueueState';
import { useFavoritesState } from './hooks/useFavoriteState';
import { useAudioControls } from './hooks/useAudioControls';
import { useProgressTracking } from './hooks/useProgressTracking';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { useAudioStorage } from '../hooks/useAudioStorage';
import logger from '../utils/logger';

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
        const duration = spotify.audioRef.current?.duration;
        logger.info('Spotify track playing', {
          track: audioState.currentSong
        });
        audioState.setIsPlaying(true);
        if (!isNaN(duration)) {
          audioState.setDuration(duration);
        }
      },
      onPause: () => {
        logger.info('Spotify track paused', {
          track: audioState.currentSong
        });
        audioState.setIsPlaying(false);
      },
      onEnded: async () => {
        logger.info('Spotify track ended', {
          track: audioState.currentSong
        });
        if (queueState.hasNext) {
          const nextTrack = await queueState.playNext();
          if (nextTrack) {
            await audioControls.playSong(nextTrack);
          }
        } else {
          logger.info('Playback ended - no more tracks in queue');
          audioState.setIsPlaying(false);
          audioState.setCurrentSong(null);
          audioState.setProgress(0);
          audioState.setDuration(0);
        }
      }
    });

    return cleanup;
  }, [spotify, audioState, queueState, audioControls]);

  const handleYouTubeStateChange = async (event) => {
    const stateMap = {
      '-1': 'unstarted',
      '0': 'ended',
      '1': 'playing',
      '2': 'paused',
      '3': 'buffering',
      '5': 'video cued'
    };

    // YouTube states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    switch (event.data) {
      case 0: // ended
        logger.info('YouTube track ended', { 
          track: audioState.currentSong,
          state: stateMap[event.data]
        });
        if (queueState.hasNext) {
          const nextTrack = await queueState.playNext();
          if (nextTrack) {
            await audioControls.playSong(nextTrack);
          }
        } else {
          logger.info('Playback ended - no more tracks in queue');
          audioState.setIsPlaying(false);
          audioState.setCurrentSong(null);
          audioState.setProgress(0);
          audioState.setDuration(0);
        }
        break;
      case 1: // playing
        logger.info('YouTube track playing', { 
          track: audioState.currentSong,
          state: stateMap[event.data]
        });
        audioState.setIsPlaying(true);
        break;
      case 2: // paused
        logger.info('YouTube track paused', { 
          track: audioState.currentSong,
          state: stateMap[event.data]
        });
        audioState.setIsPlaying(false);
        break;
      case 3: // buffering
        logger.info('YouTube track buffering', { 
          track: audioState.currentSong,
          state: stateMap[event.data]
        });
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    youtube.setupEventHandlers({
      onStateChange: handleYouTubeStateChange
    });
  }, [youtube, audioState, queueState, audioControls]);

  const handlePlayNext = async () => {
    const nextTrack = await queueState.playNext();
    if (nextTrack) {
      logger.info('Playing next track', { track: nextTrack });
      await audioControls.playSong(nextTrack);
    } else {
      logger.info('No next track available');
    }
  };

  const handlePlayPrevious = async () => {
    const previousTrack = await queueState.playPrevious();
    if (previousTrack) {
      logger.info('Playing previous track', { track: previousTrack });
      await audioControls.playSong(previousTrack);
    } else {
      logger.info('No previous track available');
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
    playPrevious: handlePlayPrevious,
    handleYouTubeStateChange,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};