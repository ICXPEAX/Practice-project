import axios from 'axios';

const API_URL = 'http://localhost:5000/api/logs';

const logService = {
  createLog: async (logData) => {
    try {
      const response = await axios.post(API_URL, logData);
      return response.data;  // Теперь возвращает созданный лог
    } catch (error) {
      console.error('Error creating log:', error.response?.data || error.message);
      throw error;
    }
  },

  getAllLogs: async (params = {}) => {
    try {
      const response = await axios.get(API_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error.response?.data || error.message);
      throw error;
    }
  },

  getRecentLogs: async (limit = 4) => {
    try {
      const response = await axios.get(API_URL, { 
        params: { 
          limit,
          sort: 'desc' 
        } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent logs:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteLog: async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error('Error deleting log:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default logService;