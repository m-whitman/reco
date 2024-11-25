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
  console.log(`\n🔍 Starting search for: "${searchedVideoTitle}" by ${artistName}`);
  
  try {
    // Search for relevant playlists
    const searchResponse = await youtube.search.list({
      part: "snippet",
      q: `${artistName} ${searchedVideoTitle} similar songs playlist`,
      type: "playlist",
      maxResults: 10,
      key: process.env.YOUTUBE_API_KEY,
    });

    const playlists = searchResponse.data.items;
    console.log(`📋 Found ${playlists.length} playlists`);

    // Check each playlist until we find a suitable one
    for (const playlist of playlists) {
      try {
        // Get playlist items
        const playlistItemsResponse = await youtube.playlistItems.list({
          part: "snippet",
          playlistId: playlist.id.playlistId,
          maxResults: 50,
          key: process.env.YOUTUBE_API_KEY,
        });

        const items = playlistItemsResponse.data.items;
        
        // Basic validation checks
        if (items.length < 25) {
          console.log(`Skipping playlist: Too few items (${items.length})`);
          continue;
        }

        // Check for available videos
        const availableRecommendations = [];
        
        for (const item of items) {
          if (availableRecommendations.length >= 100) break;

          const isAvailable = await checkYouTubeVideoAvailability(item.snippet.resourceId.videoId);
          
          if (isAvailable) {
            availableRecommendations.push({
              title: decodeHTMLEntities(item.snippet.title),
              artist: decodeHTMLEntities(item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle),
              source: "YouTube",
              url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
              imageUrl: item.snippet.thumbnails.medium.url,
              id: item.snippet.resourceId.videoId,
            });
          }
        }

        // If we found enough recommendations, return them
        if (availableRecommendations.length >= 25) {
          console.log(`\n✅ Found ${availableRecommendations.length} valid recommendations`);
          return availableRecommendations;
        }
        
        console.log(`Skipping playlist: Not enough available videos (${availableRecommendations.length})`);
      } catch (error) {
        console.log(`Error checking playlist: ${error.message}`);
        continue;
      }
    }

    console.log('No suitable playlists found');
    return [];
  } catch (error) {
    console.error("❌ Error getting YouTube recommendations:", error.message);
    return [];
  }
}

module.exports = {
  searchYouTube,
  getYouTubeRecommendations,
};