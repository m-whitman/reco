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
      return track.id || track.spotifyId || track.url?.split('/').pop() || 
        `spotify-${track.name}-${track.artist}`.replace(/\s+/g, '-').toLowerCase();
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

  const normalizeTrack = (track) => {
    return {
      ...track,
      id: trackId,
      name: track.name || track.title,
      imageUrl: track.imageUrl || track.thumbnail,
      url: track.url,
      artist: track.artist || track.channelTitle,
      source: source,
      previewUrl: track.previewUrl
    };
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    onPlay(normalizeTrack(track));
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleFavorite(normalizeTrack(track));
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

export default React.memo(TrackCard);
