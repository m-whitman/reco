import React, { forwardRef, useImperativeHandle, useState, useCallback, useRef } from 'react';
import YouTube from 'react-youtube';
import { isMobileDevice } from '../utils/deviceDetection';

const YouTubePlayer = forwardRef((props, ref) => {
  const { videoId, onStateChange } = props;
  const [player, setPlayer] = useState(null);
  const lastStateRef = useRef(null);
  const isMobile = isMobileDevice();

  const opts = {
    height: isMobile ? '200' : '0',
    width: isMobile ? '100%' : '0',
    playerVars: {
      autoplay: 1,
      controls: isMobile ? 1 : 0,
      enablejsapi: 1,
      origin: window.location.origin,
      rel: 0,
      modestbranding: 1,
      disablekb: !isMobile,
      fs: isMobile ? 1 : 0,
      playsinline: 1,
      hl: 'en',
      iv_load_policy: 3,
      host: 'https://www.youtube-nocookie.com',
    },
  };

  useImperativeHandle(
    ref,
    () => player,
    [player]
  );

  const onReady = useCallback((event) => {
    const ytPlayer = event.target;
    setPlayer(ytPlayer);
    
    if (videoId) {
      ytPlayer.loadVideoById(videoId);
    }
  }, [videoId]);

  const handleStateChange = useCallback((event) => {
    if (lastStateRef.current !== event.data) {
      lastStateRef.current = event.data;
      onStateChange(event);
    }
  }, [onStateChange]);

  return (
    <div style={{ 
      position: isMobile ? 'fixed' : 'absolute',
      bottom: isMobile ? '80px' : 0,  // Adjust based on your player controls height
      left: 0,
      right: 0,
      opacity: isMobile ? 1 : 0,
      pointerEvents: isMobile ? 'auto' : 'none',
      zIndex: isMobile ? 1000 : -1,
      backgroundColor: isMobile ? '#000' : 'transparent'
    }}>
      <YouTube 
        videoId={videoId} 
        opts={opts} 
        onReady={onReady}
        onStateChange={handleStateChange}
        onError={(error) => console.error('YouTube Error:', error)}
      />
    </div>
  );
});

YouTubePlayer.displayName = 'YouTubePlayer';

export default YouTubePlayer;