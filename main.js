const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const fs = require('fs');
const path = require('path');

const SPOTIFY_CLIENT_ID = '61750e25fc634143a5e9032b49483c58'
const SPOTIFY_CLIENT_SECRET = '91ee13dbe42c4e919781f60106bbe723'
const SPOTIFY_REDIRECT_URI = 'http://localhost:8888/callback'

const TOKEN_PATH = path.join(__dirname, 'spotify_tokens.json');

// Configure the Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
  redirectUri: SPOTIFY_REDIRECT_URI
});

const app = express();
const port = 8888;

// Function to save tokens to a file
function saveTokens(access_token, refresh_token) {
  const tokens = { access_token, refresh_token };
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
}

// Function to load tokens from a file
function loadTokens() {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
    if (!tokens.refresh_token) {
      console.log("No refresh token found in saved tokens.");
      return null;
    }
    return tokens;
  } catch (error) {
    console.log("Error loading tokens:", error.message);
    return null;
  }
}

// Add these new functions
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  const scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'user-read-recently-played'];

  res.redirect(spotifyApi.createAuthorizeURL(scopes, state));
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    saveTokens(access_token, refresh_token);

    console.log('Access token:', access_token);
    console.log('Refresh token:', refresh_token);

    res.send('Login successful! You can now close this window and run the script again.');
  } catch (err) {
    console.error('Error getting tokens:', err);
    res.send('Error getting tokens');
  }
});

async function refreshAccessToken() {
  const tokens = loadTokens();
  if (!tokens || !tokens.refresh_token) {
    console.log('No valid refresh token available. Please re-authorize the application.');
    return false;
  }

  try {
    spotifyApi.setRefreshToken(tokens.refresh_token);
    const data = await spotifyApi.refreshAccessToken();
    const access_token = data.body['access_token'];
    spotifyApi.setAccessToken(access_token);
    saveTokens(access_token, tokens.refresh_token);
    console.log('Access token has been refreshed');
    return true;
  } catch (error) {
    console.error('Could not refresh access token:', error.message);
    if (error.message.includes('refresh_token must be supplied')) {
      console.log('Invalid refresh token. Please re-authorize the application.');
      return false;
    }
    throw error;
  }
}

async function getAllTopTracks() {
  const allTopTracks = [];
  const timeRanges = ['short_term', 'medium_term', 'long_term'];

  for (const timeRange of timeRanges) {
    try {
      const data = await spotifyApi.getMyTopTracks({ limit: 50, time_range: timeRange });
      console.log(`Fetched ${data.body.items.length} top tracks for ${timeRange}`);
      allTopTracks.push(...data.body.items);
    } catch (error) {
      console.error(`Error fetching top tracks for ${timeRange}:`, error);
    }
  }

  return allTopTracks;
}

async function getRecentlyPlayedTracks() {
  try {
    const data = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 });
    console.log(`Fetched ${data.body.items.length} recently played tracks`);
    return data.body.items;
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    return [];
  }
}

async function getAudioFeatures(trackId) {
  try {
    const data = await spotifyApi.getAudioFeaturesForTrack(trackId);
    return data.body;
  } catch (error) {
    console.error(`Error fetching audio features for track ${trackId}:`, error);
    return null;
  }
}

async function collectUserData() {
  console.log("Collecting user data...");
  const topTracks = await getAllTopTracks();
  const recentTracks = await getRecentlyPlayedTracks();

  const uniqueTracks = {};
  const sourceCounts = { top: 0, recent: 0 };

  for (const track of recentTracks) {
    if (!uniqueTracks[track.track.id]) {
      uniqueTracks[track.track.id] = { source: 'recent', track: track.track };
      sourceCounts.recent++;
    }
  }

  for (const track of topTracks) {
    if (!uniqueTracks[track.id]) {
      uniqueTracks[track.id] = { source: 'top', track };
      sourceCounts.top++;
    }
  }

  console.log(`Collected ${Object.keys(uniqueTracks).length} unique tracks`);
  return { uniqueTracks, sourceCounts };
}

async function getTrackFeatures(track) {
  const audioFeatures = await getAudioFeatures(track.id);
  if (audioFeatures) {
    return {
      'Track ID': track.id,
      'Track': track.name,
      'Artist': track.artists[0].name,
      'Artist ID': track.artists[0].id,
      'Danceability': audioFeatures.danceability,
      'Energy': audioFeatures.energy,
      'Valence': audioFeatures.valence,
      'Acousticness': audioFeatures.acousticness,
      'Instrumentalness': audioFeatures.instrumentalness,
      'Liveness': audioFeatures.liveness,
      'Speechiness': audioFeatures.speechiness,
      'Tempo': audioFeatures.tempo
    };
  }
  return null;
}

async function getGenreInfo(trackIds) {
  console.log("Fetching genre information");
  const genres = [];
  for (let i = 0; i < trackIds.length; i += 50) {
    const batch = trackIds.slice(i, i + 50);
    try {
      const tracks = await spotifyApi.getTracks(batch);
      for (const track of tracks.body.tracks) {
        const artist = await spotifyApi.getArtist(track.artists[0].id);
        genres.push(...artist.body.genres);
      }
      console.log(`Processed genres for tracks ${i} to ${i + batch.length}`);
    } catch (error) {
      console.error(`Error fetching genre info for batch starting at ${i}:`, error);
    }
  }
  console.log(`Collected ${genres.length} genre tags`);
  return genres.reduce((acc, genre) => {
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});
}

async function getNewTracks(userTracks, genreInfo, n = 100) {
  console.log(`Fetching ${n} new tracks based on user's top genres`);
  const newTracks = [];
  const seedGenres = Object.keys(genreInfo).slice(0, 5);
  console.log(`Using seed genres: ${seedGenres}`);

  let attempts = 0;
  const maxAttempts = 3;

  while (newTracks.length < n && attempts < maxAttempts) {
    try {
      console.log("Attempting to fetch recommendations from Spotify API");

      const userInfo = await spotifyApi.getMe();
      const market = userInfo.body.country;

      const params = {
        seed_genres: seedGenres,
        limit: Math.min(100, n - newTracks.length),
        market: market,
        target_popularity: 70,
        min_popularity: 20,
      };

      const recommendations = await spotifyApi.getRecommendations(params);
      console.log("Successfully received response from Spotify API");

      const tracks = recommendations.body.tracks;
      console.log(`Fetched ${tracks.length} recommendations`);

      for (const track of tracks) {
        if (!userTracks[track.id] && !newTracks.some(t => t['Track ID'] === track.id)) {
          const trackFeatures = await getTrackFeatures(track);
          if (trackFeatures) {
            newTracks.push(trackFeatures);
          }
          if (newTracks.length >= n) break;
        }
      }
      console.log(`Current number of new tracks: ${newTracks.length}`);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (newTracks.length < n) {
    console.warn(`Could only fetch ${newTracks.length} tracks. Using fallback method.`);
    // Implement fallback method if needed
  }

  console.log(`Fetched a total of ${newTracks.length} new tracks`);
  return newTracks;
}

async function main() {
  const tokens = loadTokens();
  if (tokens) {
    spotifyApi.setAccessToken(tokens.access_token);
    spotifyApi.setRefreshToken(tokens.refresh_token);
    if (!(await refreshAccessToken())) {
      console.log("Failed to refresh token. Please re-authorize.");
      startAuthServer();
      return;
    }
  } else {
    console.log("No tokens found. Please authorize the application.");
    startAuthServer();
    return;
  }

  try {
    await refreshAccessToken();

    console.log("Fetching your listening history...");
    const { uniqueTracks, sourceCounts } = await collectUserData();

    const userTracks = [];
    for (const [id, { source, track }] of Object.entries(uniqueTracks)) {
      const trackFeatures = await getTrackFeatures(track);
      if (trackFeatures) {
        trackFeatures.Source = source;
        userTracks.push(trackFeatures);
      }
    }

    console.log("Analyzing genre information...");
    const genreInfo = await getGenreInfo(userTracks.map(t => t['Track ID']));
    console.log("Top 5 genres in your listening history:");
    console.table(Object.entries(genreInfo).sort((a, b) => b[1] - a[1]).slice(0, 5));

    console.log("Fetching new tracks for recommendations...");
    const newTracks = await getNewTracks(uniqueTracks, genreInfo, 100);

    console.log(`\nTotal number of your tracks: ${userTracks.length}`);
    console.log(`Tracks from recently played: ${sourceCounts.recent}`);
    console.log(`Tracks from top tracks: ${sourceCounts.top}`);
    console.log(`Number of new tracks fetched: ${newTracks.length}`);

    console.log("\nRecommended new tracks:");
    console.table(newTracks.map(t => ({ Track: t.Track, Artist: t.Artist })));

    const recentTracks = userTracks.filter(t => t.Source === 'recent');
    const avgFeatures = ['Danceability', 'Energy', 'Valence'].reduce((acc, feature) => {
      acc[feature] = recentTracks.reduce((sum, t) => sum + t[feature], 0) / recentTracks.length;
      return acc;
    }, {});

    console.log("\nAverage features of your recently played tracks:");
    console.table(avgFeatures);

    const currentUser = await spotifyApi.getMe();
    console.log(`\nCurrently logged in as: ${currentUser.body.display_name} (ID: ${currentUser.body.id})`);

  } catch (error) {
    console.error("An error occurred:", error);
    if (error.statusCode === 401) {
      console.log("Authentication error. Please re-authorize the application.");
      startAuthServer();
    }
  }
}

function startAuthServer() {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Please visit http://localhost:${port}/login to authorize the application`);
  });
}

main();