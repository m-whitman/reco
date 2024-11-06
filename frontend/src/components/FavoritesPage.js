import React from 'react';
import styles from './FavoritesPage.module.css';
import Layout from './Layout';
import { useAudio } from "../contexts/AudioContext";
import TrackCard from './TrackCard';

function FavoritesPage() {
  const { 
    favorites, 
    currentSong, 
    isPlaying, 
    playSong, 
    toggleFavorite,
    isFavorite 
  } = useAudio();

  const handlePlay = (track) => {
    playSong(track);
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h2 className={styles.title}>Your Favorites</h2>

        {favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>No favorite tracks yet</p>
            <p className={styles.emptySubtext}>
              Start adding favorites by clicking the heart icon on any track
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {favorites.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                source={track.source}
                onPlay={handlePlay}
                onToggleFavorite={toggleFavorite}
                isFavorite={isFavorite(track)}
                isPlaying={isPlaying}
                isCurrentTrack={currentSong?.id === track.id}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default FavoritesPage;