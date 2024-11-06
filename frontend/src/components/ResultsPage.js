import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import AudioPlayer from "./AudioPlayer";
import FavoritesSidebar from "./FavoritesSidebar";
import TrackCard from "./TrackCard";
import { useAudio } from "../contexts/AudioContext";
import styles from "./ResultsPage.module.css";

function ResultsPage() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const { 
    currentSong, 
    isPlaying,
    playSong, 
    toggleFavorite, 
    favorites,
    isFavorite,
    updateQueue
  } = useAudio();
  const { results, error, query } = location.state || {};

  const handlePlay = (track) => {
    console.log(`Playing ${track.source} track:`, track);

    // Create queue based on section
    let queueTracks;
    if (track.id === normalizedSpotifyTrack?.id || track.id === normalizedYoutubeTrack?.id) {
      // If playing from search results section
      queueTracks = [normalizedSpotifyTrack, normalizedYoutubeTrack].filter(Boolean);
    } else {
      // If playing from recommendations section
      queueTracks = mixedRecommendations.map(item => 
        normalizeTrack(item.track, item.source)
      );
    }

    updateQueue(queueTracks, track);
    playSong(track);
  };

  // Function to mix recommendations from both sources
  const getMixedRecommendations = (spotifyRecs, youtubeRecs) => {
    const mixed = [];
    const maxLength = Math.max(spotifyRecs.length, youtubeRecs.length);

    for (let i = 0; i < maxLength; i++) {
      // Add Spotify track if available
      if (i < spotifyRecs.length) {
        mixed.push({
          track: spotifyRecs[i],
          source: 'Spotify'
        });
      }
      // Add YouTube track if available
      if (i < youtubeRecs.length) {
        mixed.push({
          track: youtubeRecs[i],
          source: 'YouTube'
        });
      }
    }

    // Round down to nearest multiple of 3
    const roundedLength = Math.floor(mixed.length / 3) * 3;
    return mixed.slice(0, roundedLength);
  };

  if (error) {
    return (
      <Layout>
        <div className={styles.container}>
          <h2 className={styles.title}>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')}>Back to Search</button>
        </div>
        <FavoritesSidebar 
          favorites={favorites}
          onPlay={handlePlay}
          onRemoveFavorite={toggleFavorite}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
      </Layout>
    );
  }

  if (!results) {
    return (
      <Layout>
        <div className={styles.container}>
          <h2 className={styles.title}>No Results</h2>
          <p>No results found for "{query}"</p>
          <button onClick={() => navigate('/')}>Back to Search</button>
        </div>
        <FavoritesSidebar 
          favorites={favorites}
          onPlay={handlePlay}
          onRemoveFavorite={toggleFavorite}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
      </Layout>
    );
  }

  const mixedRecommendations = getMixedRecommendations(
    results.recommendations.spotify,
    results.recommendations.youtube
  );

  // Normalize track data for searched tracks
  const normalizeTrack = (track, source) => ({
    ...track,
    id: source === 'Spotify' ? 
      (track.id || track.url?.split('/').pop()) : // Use the Spotify URL ID as fallback
      (track.videoId || track.id),
    name: track.name || track.title,
    artist: track.artist || track.artistName,
    source: source,
    imageUrl: track.imageUrl || track.thumbnail,
    url: track.url || track.externalUrl,
    previewUrl: track.previewUrl
  });

  const normalizedSpotifyTrack = results.searchedTrack.spotify 
    ? normalizeTrack(results.searchedTrack.spotify, 'Spotify')
    : null;

  const normalizedYoutubeTrack = results.searchedTrack.youtube
    ? normalizeTrack(results.searchedTrack.youtube, 'YouTube')
    : null;

  return (
    <Layout>
      <div className={styles.container}>
        <h2 className={styles.title}>Search Results for "{query}"</h2>

        <div className={styles.infoCard}>
          <span className={styles.infoIcon}>ℹ️</span>
          <p className={styles.infoText}>
            Due to Spotify API limitations, Spotify tracks are limited to 30-second preview clips
          </p>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Searched Track</h3>
          <div className={styles.grid}>
            {normalizedSpotifyTrack && (
              <TrackCard
                track={normalizedSpotifyTrack}
                source="Spotify"
                onPlay={handlePlay}
                onToggleFavorite={toggleFavorite}
                isPlaying={isPlaying && currentSong?.id === normalizedSpotifyTrack.id}
                isCurrentTrack={currentSong?.id === normalizedSpotifyTrack.id}
                isFavorite={isFavorite(normalizedSpotifyTrack.id)}
              />
            )}
            {normalizedYoutubeTrack && (
              <TrackCard
                track={normalizedYoutubeTrack}
                source="YouTube"
                onPlay={handlePlay}
                onToggleFavorite={toggleFavorite}
                isPlaying={isPlaying && currentSong?.id === normalizedYoutubeTrack.id}
                isCurrentTrack={currentSong?.id === normalizedYoutubeTrack.id}
                isFavorite={isFavorite(normalizedYoutubeTrack.id)}
              />
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recommended Tracks</h3>
          <div className={styles.grid}>
            {mixedRecommendations.map(item => (
              <TrackCard
                key={`${item.source}-${item.track.id}`}
                track={normalizeTrack(item.track, item.source)}
                source={item.source}
                onPlay={handlePlay}
                onToggleFavorite={toggleFavorite}
                isPlaying={isPlaying && currentSong?.id === normalizeTrack(item.track, item.source).id}
                isCurrentTrack={currentSong?.id === normalizeTrack(item.track, item.source).id}
                isFavorite={isFavorite(item.track.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <FavoritesSidebar 
        favorites={favorites}
        onPlay={handlePlay}
        onRemoveFavorite={toggleFavorite}
        currentSong={currentSong}
        isPlaying={isPlaying}
      />
      {currentSong && <AudioPlayer />}
      <div className={styles.bottomPadding}></div>
    </Layout>
  );
}

export default ResultsPage;
