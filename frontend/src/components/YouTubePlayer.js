import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import YouTube from 'react-youtube';

const YouTubePlayer = forwardRef((props, ref) => {
  const { videoId, onStateChange } = props;
  const [player, setPlayer] = useState(null);
  
  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      enablejsapi: 1,
      origin: window.location.origin,
      rel: 0,
      // Disable analytics and tracking features
      modestbranding: 1,
      disablekb: 1,
      fs: 0,
      hl: 'en',
      // Disable annotations and info cards
      iv_load_policy: 3,
      // Use privacy-enhanced mode
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
    const playerState = event.data;
    
    if (onStateChange) {
      onStateChange(playerState);
    }
  }, [onStateChange]);

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, opacity: 0, pointerEvents: 'none' }}>
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