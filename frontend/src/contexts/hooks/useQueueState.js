import { useState, useCallback } from 'react';

export const useQueueState = () => {
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  const updateQueue = (tracks, currentTrack) => {
    setQueue(tracks);
    setQueueIndex(tracks.findIndex(track => track.id === currentTrack.id));
  };

  const playNext = useCallback(async () => {
    if (queueIndex < queue.length - 1) {
      const nextTrack = queue[queueIndex + 1];
      setQueueIndex(queueIndex + 1);
      return nextTrack;
    }
    return null;
  }, [queue, queueIndex]);

  const playPrevious = useCallback(async () => {
    if (queueIndex > 0) {
      const previousTrack = queue[queueIndex - 1];
      setQueueIndex(queueIndex - 1);
      return previousTrack;
    }
    return null;
  }, [queue, queueIndex]);

  return {
    queue,
    setQueue,
    queueIndex,
    setQueueIndex,
    updateQueue,
    playNext,
    playPrevious,
    hasNext: queueIndex < queue.length - 1,
    hasPrevious: queueIndex > 0
  };
};