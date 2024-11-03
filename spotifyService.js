const axios = require("axios");

async function getSpotifyAccessToken() {
  try {
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      params: {
        grant_type: "client_credentials",
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Spotify access token:", error.message);
    throw error;
  }
}

async function searchSpotify(query, accessToken) {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=5`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    
    const tracks = response.data.tracks.items;
    if (!tracks || tracks.length === 0) {
      console.log("No Spotify tracks found for query:", query);
      return null;
    }

    // Get the first track regardless of preview URL
    const track = tracks[0];

    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      url: track.external_urls.spotify,
      imageUrl: track.album.images[0]?.url,
      previewUrl: track.preview_url || null, // Include preview URL if available
      source: 'Spotify',
    };
  } catch (error) {
    console.error("Error searching Spotify:", error.message);
    return null;
  }
}

async function getSpotifyRecommendations(trackId, accessToken) {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/recommendations?seed_tracks=${trackId}&limit=50`, // Increased to 50 to get more potential tracks
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Filter tracks with preview URLs but don't limit to 5 anymore
    const recommendations = response.data.tracks
      .filter(track => track.preview_url)
      .map((track) => ({
        title: track.name,
        artist: track.artists[0].name,
        source: "Spotify",
        url: track.external_urls.spotify,
        imageUrl: track.album.images[0]?.url,
        previewUrl: track.preview_url,
      }));

    return recommendations;
  } catch (error) {
    console.error("Error getting Spotify recommendations:", error.message);
    return [];
  }
}

module.exports = {
  getSpotifyAccessToken,
  searchSpotify,
  getSpotifyRecommendations,
};