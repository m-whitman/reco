import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "./Layout";
import NavBar from "./NavBar";
import AudioPlayer from "./AudioPlayer";
import FavoritesSidebar from "./FavoritesSidebar";
import TrackCard from "./TrackCard";
import { useAudio } from "./AudioContext";
import styles from "./ResultsPage.module.css";

function ResultsPage() {
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
        <NavBar />
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
        <NavBar />
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
    id: track.id || `${source}-${track.name}-${track.artist}`.replace(/\s+/g, '-').toLowerCase(),
    source: source
  });

  const normalizedSpotifyTrack = results.searchedTrack.spotify 
    ? normalizeTrack(results.searchedTrack.spotify, 'Spotify')
    : null;

  const normalizedYoutubeTrack = results.searchedTrack.youtube
    ? normalizeTrack(results.searchedTrack.youtube, 'YouTube')
    : null;

  return (
    <Layout>
      <NavBar />
      <div className={styles.container}>
        <h2 className={styles.title}>Search Results for "{query}"</h2>
        
        <div className={styles.introSection}>
          <p className={styles.introText}>
            Stop switching between platforms to find new music.<br />
            Reco brings together songs from Spotify and YouTube in one search*.<br />
            You get smarter recommendations for better music discovery.
          </p>
          
          <p className={styles.footnote}>
            * More platforms coming soon
          </p>
          
          <div className={styles.infoBox}>
            <span className={styles.infoIcon}>ℹ️</span>
            <p className={styles.infoText}>
              Due to Spotify API limitations, Spotify tracks are limited to 30-second preview clips
            </p>
          </div>
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
                isFavorite={isFavorite(normalizedSpotifyTrack)}
                isPlaying={isPlaying}
                isCurrentTrack={currentSong?.id === normalizedSpotifyTrack.id}
              />
            )}
            {normalizedYoutubeTrack && (
              <TrackCard
                track={normalizedYoutubeTrack}
                source="YouTube"
                onPlay={handlePlay}
                onToggleFavorite={toggleFavorite}
                isFavorite={isFavorite(normalizedYoutubeTrack)}
                isPlaying={isPlaying}
                isCurrentTrack={currentSong?.id === normalizedYoutubeTrack.id}
              />
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recommendations</h3>
          {mixedRecommendations.length === 0 ? (
            <p className={styles.noResults}>No recommendations found</p>
          ) : (
            <div className={styles.grid}>
              {mixedRecommendations.map((item, index) => {
                const normalizedTrack = normalizeTrack(item.track, item.source);
                
                return (
                  <TrackCard
                    key={`${item.source.toLowerCase()}-${index}`}
                    track={normalizedTrack}
                    source={item.source}
                    onPlay={handlePlay}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite(normalizedTrack)}
                    isPlaying={isPlaying}
                    isCurrentTrack={currentSong?.id === normalizedTrack.id}
                  />
                );
              })}
            </div>
          )}
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
