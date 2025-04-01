import axios from 'axios';

const RAWG_API_KEY = process.env.REACT_APP_RAWG_API_KEY;
const RAWG_API_URL = 'https://api.rawg.io/api';

const genreSlugs = {
  "Racing": "racing",
  "Arcade": "arcade",
  "Action": "action",
  "Adventure": "adventure",
  "RPG": "role-playing-games-rpg",
  "Shooter": "shooter",
  "Strategy": "strategy",
  "Simulation": "simulation",
  "Puzzle": "puzzle",
  "Sports": "sports",
  "Fighting": "fighting",
  "Family": "family",
  "Board Games": "board-games",
  "Educational": "educational",
  "Card": "card"
};

const rawgService = {
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
  getPopularGames: async () => {
    try {
      const response = await axios.get(`${RAWG_API_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
          ordering: '-added',
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching popular games from RAWG API:', error);
      throw error;
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
      // Use the mapping to get the proper slug, or use the genre name as fallback
      const genreSlug = genreSlugs[genre] || genre.toLowerCase();

      const response = await axios.get(`${RAWG_API_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
          genres: genreSlug,
          page_size: 40, // Fetch more games at once
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
};

export default rawgService;
