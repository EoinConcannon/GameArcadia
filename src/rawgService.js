import axios from 'axios';

const RAWG_API_KEY = process.env.REACT_APP_RAWG_API_KEY;
const RAWG_API_URL = 'https://api.rawg.io/api';

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
      const response = await axios.get(`${RAWG_API_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
          genres: genre,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching games by genre:', error);
      return [];
    }
  },
};

export default rawgService;
