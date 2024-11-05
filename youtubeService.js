const { google } = require("googleapis");
const youtube = google.youtube("v3");

function decodeHTMLEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  
  return text.replace(/&[#\w]+;/g, entity => entities[entity] || entity);
}

async function checkYouTubeVideoAvailability(videoId) {
  try {
    const response = await youtube.videos.list({
      part: "status,contentDetails",
      id: videoId,
      key: process.env.YOUTUBE_API_KEY,
    });

    if (!response.data.items || response.data.items.length === 0) {
      return false;
    }

    const video = response.data.items[0];
    
    return (
      video.status &&
      video.status.uploadStatus === "processed" &&
      video.status.privacyStatus === "public" &&
      !video.status.rejectionReason &&
      video.contentDetails
    );
  } catch (error) {
    console.error("Error checking video availability:", error.message);
    return false;
  }
}

async function searchYouTube(query) {
  try {
    const youtubeSearchResponse = await youtube.search.list({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: 5,
      key: process.env.YOUTUBE_API_KEY,
    });

    for (const item of youtubeSearchResponse.data.items) {
      const isAvailable = await checkYouTubeVideoAvailability(item.id.videoId);
      
      if (isAvailable) {
        return {
          id: item.id.videoId,
          name: decodeHTMLEntities(item.snippet.title),
          artist: decodeHTMLEntities(item.snippet.channelTitle),
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          imageUrl: item.snippet.thumbnails.medium.url,
          source: 'YouTube'
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error searching YouTube:", error.message);
    return null;
  }
}

async function getPlaylistSize(playlistId) {
  try {
    const response = await youtube.playlists.list({
      part: "contentDetails",
      id: playlistId,
      key: process.env.YOUTUBE_API_KEY,
    });

    if (response.data.items && response.data.items[0]) {
      return response.data.items[0].contentDetails.itemCount;
    }
    return 0;
  } catch (error) {
    console.error("Error getting playlist size:", error.message);
    return 0;
  }
}

async function getYouTubeRecommendations(query, searchedVideoTitle, artistName) {
  try {
    console.log(`Searching for YouTube playlist: ${query}`);

    const searchResponse = await youtube.search.list({
      part: "snippet",
      q: `${query} playlist`,
      type: "playlist",
      maxResults: 10,
      key: process.env.YOUTUBE_API_KEY,
    });

    const playlists = searchResponse.data.items;
    if (playlists.length === 0) {
      console.log("No relevant playlists found");
      return [];
    }

    // Get sizes for all playlists and sort by size
    const playlistsWithSize = await Promise.all(
      playlists.map(async (playlist) => {
        const size = await getPlaylistSize(playlist.id.playlistId);
        return {
          ...playlist,
          size,
          isRelevant: 
            playlist.snippet.title.toLowerCase().includes(artistName.toLowerCase()) ||
            playlist.snippet.title.toLowerCase().includes("mix") ||
            playlist.snippet.title.toLowerCase().includes("playlist")
        };
      })
    );

    // Sort playlists by relevance and size
    const sortedPlaylists = playlistsWithSize.sort((a, b) => {
      // First prioritize relevant playlists
      if (a.isRelevant && !b.isRelevant) return -1;
      if (!a.isRelevant && b.isRelevant) return 1;
      // Then sort by size
      return b.size - a.size;
    });

    const selectedPlaylist = sortedPlaylists[0];

    // Function to normalize video titles for comparison
    const normalizeTitle = (title) => {
      return title.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();
    };

    const normalizedSearchedTitle = normalizeTitle(searchedVideoTitle);

    const playlistItemsResponse = await youtube.playlistItems.list({
      part: "snippet",
      playlistId: selectedPlaylist.id.playlistId,
      maxResults: 50, // Increased to 50 to get more potential videos
      key: process.env.YOUTUBE_API_KEY,
    });

    const playlistItems = playlistItemsResponse.data.items;

    // Filter and check availability of each video
    const availableRecommendations = [];
    for (const item of playlistItems) {
      if (availableRecommendations.length >= 20) break; // Increased to 20

      // Decode HTML entities in the title
      const decodedTitle = decodeHTMLEntities(item.snippet.title);
      const normalizedItemTitle = normalizeTitle(decodedTitle);
      
      // Skip if this is too similar to the searched video
      if (
        normalizedItemTitle === normalizedSearchedTitle ||
        normalizedItemTitle.includes(normalizedSearchedTitle) ||
        normalizedSearchedTitle.includes(normalizedItemTitle)
      ) {
        console.log(`Skipping similar track: ${decodedTitle}`);
        continue;
      }

      const isAvailable = await checkYouTubeVideoAvailability(item.snippet.resourceId.videoId);
      
      if (isAvailable) {
        availableRecommendations.push({
          title: decodedTitle,
          artist: decodeHTMLEntities(item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle),
          source: "YouTube",
          url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
          imageUrl: item.snippet.thumbnails.medium.url,
          id: item.snippet.resourceId.videoId,
        });
      }
    }
    
    return availableRecommendations;
  } catch (error) {
    console.error("Error getting YouTube recommendations:", error.message);
    return [];
  }
}

module.exports = {
  searchYouTube,
  getYouTubeRecommendations,
};