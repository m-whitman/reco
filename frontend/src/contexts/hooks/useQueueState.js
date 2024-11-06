import { useState } from 'react';

export const useQueueState = () => {
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);

  const updateQueue = (tracks, currentTrack) => {
    setQueue(tracks);
    setQueueIndex(tracks.findIndex(track => track.id === currentTrack.id));
  };

  return {
    queue,
    setQueue,
    queueIndex,
    setQueueIndex,
    updateQueue,
    hasNext: queueIndex < queue.length - 1,
    hasPrevious: queueIndex > 0
  };
};