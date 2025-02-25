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
};

export default rawgService;