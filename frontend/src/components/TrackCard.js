import React from "react";
import { FaPlay, FaPause, FaHeart, FaSpotify, FaYoutube } from "react-icons/fa";
import styles from "./ResultsPage.module.css";

function TrackCard({ 
  track, 
  source, 
  onPlay, 
  onToggleFavorite, 
  isFavorite,
  isPlaying,
  isCurrentTrack 
}) {
  const getTrackId = (track, source) => {
    if (source === 'YouTube') {
      return track.videoId || track.id;
    } else if (source === 'Spotify') {
      return track.id || `spotify-${track.name}-${track.artist}`.replace(/\s+/g, '-').toLowerCase();
    }
    return track.id;
  };

  const trackId = getTrackId(track, source);
  const trackName = track.name || track.title;
  const trackImage = track.imageUrl || track.thumbnail;
  const trackArtist = track.artist || track.channelTitle;

  if (!track) {
    return <div>No track data available</div>;
  }

  const handlePlay = (e) => {
    e.stopPropagation();
    const normalizedTrack = {
      ...track,
      id: trackId,
      name: trackName,
      imageUrl: trackImage,
      url: track.url,
      artist: trackArtist,
      source: source,
      previewUrl: track.previewUrl
    };
    
    // If this is the current track, we want to toggle play/pause
    // If it's a different track, we want to start playing it
    onPlay(normalizedTrack);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    
    const normalizedTrack = {
      ...track,
      id: trackId,
      name: trackName,
      imageUrl: trackImage,
      url: track.url,
      artist: trackArtist,
      source: source,
      previewUrl: track.previewUrl
    };
    onToggleFavorite(normalizedTrack);
  };

  const getExternalUrl = (track) => {
    if (source === 'YouTube' && (track.videoId || track.id)) {
      return `https://www.youtube.com/watch?v=${track.videoId || track.id}`;
    } else if (source === 'Spotify') {
      return track.url || '#';
    }
    return '#';
  };

  const getSourceIcon = () => {
    if (source === 'YouTube') {
      return <FaYoutube className={styles.sourceIcon} style={{ color: '#FF0000' }} />;
    } else if (source === 'Spotify') {
      return <FaSpotify className={styles.sourceIcon} style={{ color: '#1DB954' }} />;
    }
    return null;
  };

  const handleCardClick = (e) => {
    // Don't trigger if clicking play/favorite buttons
    if (e.target.closest(`.${styles.cardActions}`)) {
      return;
    }
    
    const url = getExternalUrl(track);
    if (url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={`${styles.card} ${isCurrentTrack ? styles.playing : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.cardHeader}>
        <a
          href={getExternalUrl(track)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sourceLink}
          onClick={(e) => e.stopPropagation()}
        >
          {getSourceIcon()}
        </a>
        {trackImage ? (
          <img 
            src={trackImage} 
            alt={trackName} 
            className={styles.cardImage}
          />
        ) : (
          <div className={styles.noImage}>No Image Available</div>
        )}
      </div>
      <h4 className={styles.cardTitle}>
        {trackName}
      </h4>
      <p className={styles.cardArtist}>{trackArtist}</p>
      <div className={styles.cardActions}>
        <button 
          onClick={handlePlay} 
          className={`${styles.playButton} ${isCurrentTrack ? styles.currentTrack : ''}`}
        >
          {isCurrentTrack && isPlaying ? (
            <FaPause className={`${styles.playIcon} ${styles.pauseIcon}`} />
          ) : (
            <FaPlay className={styles.playIcon} />
          )}
        </button>
        <button 
          onClick={handleToggleFavorite} 
          className={styles.favoriteButton}
        >
          <FaHeart 
            className={`${styles.favoriteIcon} ${isFavorite ? styles.favorited : ''}`}
          />
        </button>
      </div>
    </div>
  );
}

export default TrackCard;
