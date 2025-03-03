import axios from 'axios';

const RAWG_API_KEY = process.env.REACT_APP_RAWG_API_KEY;
const RAWG_API_URL = 'https://api.rawg.io/api'; // RAWG API base URL

const rawgService = {
  getGames: async () => {
    try {
      const response = await axios.get(`${RAWG_API_URL}/games`, {
        params: {
          key: RAWG_API_KEY,
        },
      });
      console.log(response.data.results); // Log the response data
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
          ordering: '-added', // Sort by popularity (number of additions)
        },
      });
      console.log(response.data.results); // Log the response data
      return response.data.results;
    } catch (error) {
      console.error('Error fetching popular games from RAWG API:', error);
      throw error;
    }
  },
  // Add more methods as needed
};

export default rawgService;