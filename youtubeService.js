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
  
  const musicGenres = [
    'house', 'techno', 'disco', 'pop', 'rock', 'hip hop', 'rap', 'jazz', 
    'blues', 'soul', 'r&b', 'funk', 'electronic', 'dance', 'indie', 
    'alternative', 'metal', 'classical', 'reggae', 'folk', 'country',
    'ambient', 'trance', 'drum and bass', 'dnb', 'edm', 'synthwave',
    'lofi', 'lo-fi', 'trap', 'punk', 'grunge'
  ];

  try {
    const searchResponse = await youtube.search.list({
      part: "snippet",
      q: `${artistName} ${searchedVideoTitle} similar songs playlist`,
      type: "playlist",
      maxResults: 15,
      key: process.env.YOUTUBE_API_KEY,
    });

    const playlists = searchResponse.data.items;
    console.log(`📋 Found ${playlists.length} initial playlists`);

    const playlistsWithScore = await Promise.all(
      playlists.map(async (playlist) => {
        const size = await getPlaylistSize(playlist.id.playlistId);
        const title = ` ${playlist.snippet.title.toLowerCase()} `;
        const description = ` ${playlist.snippet.description.toLowerCase()} `;
        const artistLower = artistName.toLowerCase();
        const songLower = searchedVideoTitle.toLowerCase();
        
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
          
          console.log(`\n📊 Analyzing playlist: "${playlist.snippet.title}"`);
          
          playlistItemsResponse.data.items.forEach(item => {
            const videoTitle = decodeHTMLEntities(item.snippet.title).toLowerCase();
            
            if (videoTitle.includes(artistLower)) {
              artistSongCount++;
            }
            
            if (videoTitle.includes(songLower) && videoTitle.includes(artistLower)) {
              containsSearchedSong = true;
              console.log(`✅ Found original song in playlist`);
            }
            
            validPlaylistItems.push(item);
          });
        } catch (error) {
          console.log(`❌ Error checking playlist items: ${error.message}`);
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
          // Add genre scoring BEFORE other scoring calculations
          musicGenres.forEach(genre => {
            const genrePattern = new RegExp(`\\b${genre}\\b`, 'i');
            if (genrePattern.test(title)) {
              relevanceScore += 20;
              console.log(`📌 Genre bonus (title): ${genre} (+20) in "${playlist.snippet.title}"`);
            }
            if (genrePattern.test(description)) {
              relevanceScore += 10;
              console.log(`📌 Genre bonus (description): ${genre} (+10)`);
            }
          });

          // Add bonus for containing the searched song
          if (containsSearchedSong) {
            relevanceScore += 150;
            console.log(`Found searched song "${searchedVideoTitle}" in playlist "${playlist.snippet.title}"`);
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

        return {
          ...playlist,
          size: validPlaylistItems.length,
          validPlaylistItems,
          relevanceScore,
          isValid
        };
      })
    );

    // Only show the summary table
    const playlistSummary = playlistsWithScore
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by score descending
      .map(playlist => ({
        Title: playlist.snippet.title.substring(0, 50) + (playlist.snippet.title.length > 50 ? '...' : ''),
        Score: playlist.relevanceScore,
        Size: playlist.size,
        Valid: playlist.isValid ? '✅' : '❌'
      }));

    console.table(playlistSummary);

    const validPlaylists = playlistsWithScore.filter(playlist => playlist.isValid);
    if (validPlaylists.length === 0) return [];

    // Sort playlists by relevance score
    const sortedPlaylists = validPlaylists.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const selectedPlaylist = sortedPlaylists[0];
    console.log('\nSelected playlist:');
    console.log(`- Title: ${selectedPlaylist.snippet.title}`);
    console.log(`- Score: ${selectedPlaylist.relevanceScore}`);
    console.log(`- Size: ${selectedPlaylist.size} tracks`);

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
    console.log(`\n🎵 Fetching recommendations from selected playlist...`);
    
    for (const item of playlistItems) {
      if (availableRecommendations.length >= 35) {
        console.log(`✨ Reached target of 35 recommendations`);
        break;
      }

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
    
    console.log(`\n✅ Found ${availableRecommendations.length} valid recommendations`);
    return availableRecommendations;
  } catch (error) {
    console.error("❌ Error getting YouTube recommendations:", error.message);
    return [];
  }
}

module.exports = {
  searchYouTube,
  getYouTubeRecommendations,
};