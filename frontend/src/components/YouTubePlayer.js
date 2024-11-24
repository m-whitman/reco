import React, { forwardRef, useImperativeHandle, useState, useCallback, useRef } from 'react';
import YouTube from 'react-youtube';
import { isMobileDevice } from '../utils/deviceDetection';
import { IoClose } from 'react-icons/io5';

const YouTubePlayer = forwardRef((props, ref) => {
  const { videoId, onStateChange, onClose } = props;
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
      bottom: isMobile ? '80px' : 0,
      left: 0,
      right: 0,
      opacity: isMobile ? 1 : 0,
      pointerEvents: isMobile ? 'auto' : 'none',
      zIndex: isMobile ? 1000 : -1,
      backgroundColor: isMobile ? '#000' : 'transparent'
    }}>
      {isMobile && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 1001,
            width: '44px',
            height: '44px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.2s ease',
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          }}
        >
          <IoClose size={32} />
        </button>
      )}
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