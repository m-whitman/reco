import { createContext, useContext } from 'react';
import { AudioProvider } from './AudioProvider';

const AudioContext = createContext();

export { AudioProvider };

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default AudioContext;