import axios from 'axios';

const RAWG_API_KEY = process.env.REACT_APP_RAWG_API_KEY;
const RAWG_API_URL = 'https://api.rawg.io/api';

// Initialize with some common mappings as fallback
let genreSlugs = {
  "Racing": "racing",
  "Arcade": "arcade",
  "Action": "action",
  // ...other essential mappings
};

// Function to initialize genre slugs from API
const initializeGenreSlugs = async () => {
  try {
    console.log('Fetching complete genre list from RAWG API...');
    const response = await axios.get(`${RAWG_API_URL}/genres`, {
      params: {
        key: RAWG_API_KEY,
        page_size: 50 // Get a large number of genres
      }
    });

    // Create a mapping from genre name to slug
    const apiGenreSlugs = {};
    response.data.results.forEach(genre => {
      apiGenreSlugs[genre.name] = genre.slug;
    });

    // Update the genreSlugs with API data, but keep our fallbacks
    genreSlugs = { ...genreSlugs, ...apiGenreSlugs };
    console.log(`Genre mapping initialized with ${Object.keys(genreSlugs).length} genres`);
  } catch (error) {
    console.error('Failed to fetch genre mappings from API:', error);
    // Continue using the hardcoded fallbacks
  }
};

// Initialize when the service is first imported
initializeGenreSlugs();

const rawgService = {
  // Method to access the current genreSlugs mapping
  getGenreSlugs: () => genreSlugs,

  // Method to get a specific genre slug with fallbacks
  getGenreSlug: (genreName) => {
    if (!genreName) return '';

    // Try direct match
    if (genreSlugs[genreName]) return genreSlugs[genreName];

    // Try case-insensitive match
    const lowerGenre = genreName.toLowerCase();
    const matchKey = Object.keys(genreSlugs).find(
      key => key.toLowerCase() === lowerGenre
    );
    if (matchKey) return genreSlugs[matchKey];

    // No match, create slug from name - remove special chars, replace spaces with hyphens
    return lowerGenre.replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
  },

  getGames: async () => {
    try {
      const response = await axios.get(`${RAWG_API_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching games from RAWG API:', error);
      throw error;
    }
  },
  getPopularGames: async (pageSize = 40) => {
    try {
      const response = await axios.get(`${RAWG_API_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
          ordering: '-added', // Sort by most added to user libraries
          page_size: pageSize
        },
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching popular games:', error);
      return [];
    }
  },
  searchGames: async (query) => {
    try {
      const response = await axios.get(`${RAWG_API_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
          search: query,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error searching games from RAWG API:', error);
      throw error;
    }
  },
  getGameDetails: async (gameId) => {
    try {
      const response = await axios.get(`${RAWG_API_URL}/games/${gameId}`, {
        params: {
          key: RAWG_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching game details from RAWG API:', error);
      throw error;
    }
  },
  getGamesByGenre: async (genre) => {
    try {
      // Get the proper slug using our enhanced method
      const genreSlug = rawgService.getGenreSlug(genre);

      console.log(`Looking up games for genre: ${genre} (slug: ${genreSlug})`);

      const response = await axios.get(`${RAWG_API_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
          genres: genreSlug,
          page_size: 40,
        },
      });

      return response.data.results || [];
    } catch (error) {
      console.error(`Error fetching games for genre ${genre}:`, error);

      // Try an alternative approach - search by the genre name
      try {
        console.log(`Trying alternative search for genre: ${genre}`);
        const response = await axios.get(`${RAWG_API_URL}/games`, {
          params: {
            key: RAWG_API_KEY,
            search: genre, // Use the genre as a search term
            page_size: 20,
          },
        });

        // Log the search results
        console.log(`Alternative search found ${response.data.results.length} games for "${genre}"`);

        return response.data.results || [];
      } catch (secondError) {
        console.error(`Alternative search also failed for genre ${genre}:`, secondError);
        return [];
      }
    }
  },
  getAllGames: async (pages = 1) => {
    try {
      const allGames = [];
      for (let i = 1; i <= pages; i++) {
        const response = await axios.get(`${RAWG_API_URL}/games`, {
          params: {
            key: RAWG_API_KEY,
            page: i,
            page_size: 40
          },
        });
        allGames.push(...response.data.results);
      }
      return allGames;
    } catch (error) {
      console.error('Error fetching all games from RAWG API:', error);
      return [];
    }
  },
  getGamesPaginated: async (page = 1, pageSize = 20) => {
    try {
      const response = await axios.get(`${RAWG_API_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
          page: page,
          page_size: pageSize,
          ordering: '-rating' // Sort by highest rating first for better quality results
        },
      });

      return {
        results: response.data.results || [],
        hasNextPage: !!response.data.next,
        total: response.data.count
      };
    } catch (error) {
      console.error('Error fetching paginated games:', error);
      return { results: [], hasNextPage: false, total: 0 };
    }
  },
};

export default rawgService;
