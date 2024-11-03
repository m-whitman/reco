import React, { useState } from 'react';
import { FaPlay, FaPause, FaTimes, FaSpotify, FaYoutube } from 'react-icons/fa';
import styles from './FavoritesSideBar.module.css';

function FavoritesSidebar({ 
  favorites, 
  onPlay, 
  onRemoveFavorite, 
  currentSong, 
  isPlaying 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getSourceIcon = (source) => {
    if (source === 'YouTube') {
      return <FaYoutube className={styles.sourceIcon} style={{ color: '#FF0000' }} />;
    } else if (source === 'Spotify') {
      return <FaSpotify className={styles.sourceIcon} style={{ color: '#1DB954' }} />;
    }
    return null;
  };

  const getExternalUrl = (track) => {
    if (track.source === 'YouTube') {
      return `https://www.youtube.com/watch?v=${track.videoId || track.id}`;
    } else if (track.source === 'Spotify') {
      return track.url || '#';
    }
    return '#';
  };

  const handleItemClick = (track, e) => {
    // Don't trigger if clicking play/remove buttons
    if (e.target.closest(`.${styles.actions}`)) {
      return;
    }
    
    const url = getExternalUrl(track);
    if (url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.dragHandle} onClick={toggleExpanded}>
        <div className={styles.dragBar} />
        <div className={styles.collapsedInfo}>
          <h3 className={styles.collapsedTitle}>Favorites</h3>
        </div>
      </div>
      
      {favorites.length === 0 ? (
        <p className={styles.emptyMessage}>No favorite tracks yet</p>
      ) : (
        <div className={styles.favoritesList}>
          {favorites.map((track) => {
            const isCurrentTrack = currentSong && currentSong.id === track.id;
            
            return (
              <div 
                key={track.id} 
                className={`${styles.favoriteItem} ${isCurrentTrack ? styles.playing : ''}`}
                onClick={(e) => handleItemClick(track, e)}
              >
                <div className={styles.imageContainer}>
                  <img 
                    src={track.imageUrl} 
                    alt={track.name} 
                    className={styles.thumbnail}
                  />
                  <a
                    href={getExternalUrl(track)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getSourceIcon(track.source)}
                  </a>
                </div>
                <div className={styles.trackInfo}>
                  <p className={styles.trackName}>{track.name}</p>
                  <p className={styles.trackArtist}>{track.artist}</p>
                </div>
                <div className={styles.actions}>
                  <button 
                    onClick={() => onPlay(track)} 
                    className={`${styles.playButton} ${isCurrentTrack ? styles.currentTrack : ''}`}
                  >
                    {isCurrentTrack && isPlaying ? (
                      <FaPause className={`${styles.playIcon} ${styles.pauseIcon}`} />
                    ) : (
                      <FaPlay className={styles.playIcon} />
                    )}
                  </button>
                  <button 
                    onClick={() => onRemoveFavorite(track)}
                    className={styles.removeButton}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FavoritesSidebar;