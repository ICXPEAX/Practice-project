import axios from 'axios';

const API_URL = 'http://localhost:5000/api/logs';

const logService = {
  // Добавление нового лога
  createLog: async (logData) => {
    try {
      const response = await axios.post(API_URL, logData);
      return response.data;
    } catch (error) {
      console.error('Error creating log:', error.response?.data || error.message);
      throw error;
    }
  },

  // Получение всех логов
  getAllLogs: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching logs:', error.response?.data || error.message);
      throw error;
    }
  },

  // Получение последних логов
  getRecentLogs: async (limit = 4) => {
    try {
      const response = await axios.get(API_URL);
      // Сортируем по дате и берем последние записи
      const sortedLogs = response.data.sort((a, b) => 
        new Date(b.datetime.split(' ').reverse().join(' ')) - new Date(a.datetime.split(' ').reverse().join(' '))
      );
      return sortedLogs.slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent logs:', error.response?.data || error.message);
      throw error;
    }
  },

  // Удаление лога по ID
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