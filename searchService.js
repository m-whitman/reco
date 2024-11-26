const spotifyService = require('./spotifyService');
const youtubeService = require('./youtubeService');

async function searchAndGetRecommendations(query) {
  try {
    const spotifyAccessToken = await spotifyService.getSpotifyAccessToken();
    const spotifyTrack = await spotifyService.searchSpotify(query, spotifyAccessToken);
    const youtubeTrack = await youtubeService.searchYouTube(query);

    if (!spotifyTrack && !youtubeTrack) {
      return { error: "No matching track found" };
    }

    const [spotifyRecommendations, youtubeRecommendations] = await Promise.all([
      spotifyTrack
        ? spotifyService.getSpotifyRecommendations(spotifyTrack.id, spotifyAccessToken)
        : [],
      youtubeTrack
        ? youtubeService.getYouTubeRecommendations(query, youtubeTrack.name, youtubeTrack.artist)
        : [],
    ]);

    const spotifyRecsWithImages = spotifyRecommendations.map((rec) => ({
      ...rec,
      imageUrl: rec.imageUrl || "",
    }));

    const youtubeRecsWithImages = youtubeRecommendations.map((rec) => ({
      ...rec,
      imageUrl: rec.imageUrl || "",
    }));

    const result = {
      searchedTrack: {
        spotify: spotifyTrack,
        youtube: youtubeTrack,
      },
      recommendations: {
        spotify: spotifyRecsWithImages,
        youtube: youtubeRecsWithImages,
      },
    };

    return result;
  } catch (error) {
    console.error("Error in search and recommendations:", error.message);
    return { error: "An error occurred during the search and recommendations" };
  }
}

async function getSuggestions(query) {
  try {
    const spotifyAccessToken = await spotifyService.getSpotifyAccessToken();
    const searchResponse = await spotifyService.searchSpotify(query, spotifyAccessToken);

    const suggestions = [];

    if (searchResponse) {
      // Only add the full track with artist format
      suggestions.push(`${searchResponse.name} - ${searchResponse.artist}`);
    }

    return suggestions;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}

module.exports = {
  searchAndGetRecommendations,
  getSuggestions
};