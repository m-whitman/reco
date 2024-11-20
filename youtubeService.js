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
      q: `${artistName} ${searchedVideoTitle} similar songs playlist`,
      type: "playlist",
      maxResults: 15,
      key: process.env.YOUTUBE_API_KEY,
    });

    const playlists = searchResponse.data.items;
    if (playlists.length === 0) {
      console.log("No relevant playlists found");
      return [];
    }

    // Enhanced relevance scoring
    const playlistsWithScore = await Promise.all(
      playlists.map(async (playlist) => {
        const size = await getPlaylistSize(playlist.id.playlistId);
        const title = ` ${playlist.snippet.title.toLowerCase()} `;
        const description = ` ${playlist.snippet.description.toLowerCase()} `;
        const artistLower = artistName.toLowerCase();
        const songLower = searchedVideoTitle.toLowerCase();
        
        // Helper function for complete word matches (moved outside the isValid check)
        const hasCompleteMatch = (text, search) => {
          const searchTerms = search.split(' ');
          return searchTerms.length > 0 && text.includes(` ${search} `);
        };
        
        // Check playlist contents
        let containsSearchedSong = false;
        let artistSongCount = 0;
        let validPlaylistItems = [];
        
        try {
          const playlistItemsResponse = await youtube.playlistItems.list({
            part: "snippet",
            playlistId: playlist.id.playlistId,
            maxResults: 50,
            key: process.env.YOUTUBE_API_KEY,
          });
          
          // Get video IDs for duration check
          const videoIds = playlistItemsResponse.data.items.map(item => 
            item.snippet.resourceId.videoId
          );
          
          // Get video durations in batch
          const videosResponse = await youtube.videos.list({
            part: "contentDetails",
            id: videoIds.join(','),
            key: process.env.YOUTUBE_API_KEY,
          });
          
          // Create duration lookup map
          const durationMap = {};
          videosResponse.data.items.forEach(video => {
            durationMap[video.id] = video.contentDetails.duration;
          });
          
          playlistItemsResponse.data.items.forEach(item => {
            const videoTitle = decodeHTMLEntities(item.snippet.title).toLowerCase();
            const duration = durationMap[item.snippet.resourceId.videoId];
            
            if (duration) {
              // Convert duration to minutes (PT1H2M10S format)
              const durationInMinutes = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              const hours = parseInt(durationInMinutes[1] || 0);
              const minutes = parseInt(durationInMinutes[2] || 0);
              const totalMinutes = hours * 60 + minutes;
              
              // Check if video is by the searched artist
              if (videoTitle.includes(artistLower)) {
                artistSongCount++;
              }
              
              // Check if it's the searched song
              if (videoTitle.includes(songLower) && videoTitle.includes(artistLower)) {
                containsSearchedSong = true;
              }
              
              // Only include videos under 10 minutes
              if (totalMinutes < 10) {
                validPlaylistItems.push(item);
              }
            }
          });
        } catch (error) {
          console.log(`Error checking playlist items: ${error.message}`);
        }
        
        // Calculate relevance score
        let relevanceScore = 0;
        let isValid = true;
        let sizeFactor = 0;  // Initialize sizeFactor here
        
        // Check for too many songs by the same artist
        if (artistSongCount > 20) {
          isValid = false;
          console.log(`Skipping playlist: Too many songs (${artistSongCount}) by ${artistName}`);
        }
        
        // Only calculate score if playlist is valid
        if (isValid) {
          // Add bonus for containing the searched song
          if (containsSearchedSong) {
            relevanceScore += 150;
            console.log(`Found searched song "${searchedVideoTitle}" in playlist!`);
          }
          
          // Title and description matching
          if (hasCompleteMatch(title, artistLower)) relevanceScore += 100;
          if (hasCompleteMatch(title, songLower)) relevanceScore += 80;
          if (hasCompleteMatch(description, artistLower)) relevanceScore += 30;
          if (hasCompleteMatch(description, songLower)) relevanceScore += 20;
          
          // Type indicators
          if (title.includes(' similar ')) relevanceScore += 30;
          if (title.includes(' radio ')) relevanceScore += 25;
          if (title.includes(' mix ')) relevanceScore += 20;
          
          // Calculate size factor
          const validSize = validPlaylistItems.length;
          sizeFactor = validSize >= 30 && validSize <= 60 ? 100 :
                       validSize > 60 && validSize <= 80 ? 50 :
                       validSize > 80 && validSize <= 100 ? 30 :
                       validSize > 100 ? 10 :
                       validSize >= 15 && validSize < 30 ? 40 :
                       validSize > 0 ? 5 : 0;
          
          relevanceScore += sizeFactor;
        }

        // Log playlist details
        console.log(`Found playlist: "${playlist.snippet.title}"`);
        console.log(`  - Total size: ${size} tracks`);
        console.log(`  - Valid size: ${validPlaylistItems.length} tracks (under 10 minutes)`);
        console.log(`  - Artist song count: ${artistSongCount}`);
        console.log(`  - Valid playlist: ${isValid}`);
        console.log(`  - Score: ${relevanceScore}`);
        if (isValid) {
          console.log(`  - Factors: ${[
            containsSearchedSong ? 'Contains searched song (+150)' : '',
            hasCompleteMatch(title, artistLower) ? 'Complete artist match in title (+100)' : '',
            hasCompleteMatch(title, songLower) ? 'Complete song match in title (+80)' : '',
            hasCompleteMatch(description, artistLower) ? 'Complete artist match in description (+30)' : '',
            hasCompleteMatch(description, songLower) ? 'Complete song match in description (+20)' : '',
            title.includes(' similar ') ? 'Similar indicator (+30)' : '',
            title.includes(' radio ') ? 'Radio indicator (+25)' : '',
            title.includes(' mix ') ? 'Mix indicator (+20)' : '',
            `Size factor (+${sizeFactor})`
          ].filter(Boolean).join(', ')}`);
        }
        console.log('---');

        return {
          ...playlist,
          size: validPlaylistItems.length,
          validPlaylistItems,
          relevanceScore,
          isValid
        };
      })
    );

    // Filter out invalid playlists before sorting
    const validPlaylists = playlistsWithScore.filter(playlist => playlist.isValid);
    
    // Sort only valid playlists by score
    const sortedPlaylists = validPlaylists.sort((a, b) => 
      b.relevanceScore - a.relevanceScore
    );

    if (sortedPlaylists.length === 0) {
      console.log('No valid playlists found');
      return [];
    }

    console.log('\nSelected playlist:', sortedPlaylists[0].snippet.title);
    console.log('Final score:', sortedPlaylists[0].relevanceScore);
    console.log('Playlist size:', sortedPlaylists[0].size);

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
      if (availableRecommendations.length >= 35) break; // Changed to 35

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