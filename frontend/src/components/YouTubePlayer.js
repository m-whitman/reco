import React, { forwardRef, useImperativeHandle, useState, useCallback, useRef } from 'react';
import YouTube from 'react-youtube';

const YouTubePlayer = forwardRef((props, ref) => {
  const { videoId, onStateChange } = props;
  const [player, setPlayer] = useState(null);
  const lastStateRef = useRef(null);

  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      enablejsapi: 1,
      origin: window.location.origin,
      rel: 0,
      modestbranding: 1,
      disablekb: 1,
      fs: 0,
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