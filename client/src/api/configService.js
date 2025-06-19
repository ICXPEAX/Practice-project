import axios from 'axios';

const API_URL = 'http://localhost:5000/api/configs';

const configService = {
  // Получение всех конфигов
  getAllConfigs: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching configs:', error.response?.data || error.message);
      throw error;
    }
  },

  // Добавление нового конфига
  createConfig: async (configData) => {
    try {
      const response = await axios.post(API_URL, configData);
      return response.data;
    } catch (error) {
      console.error('Error creating config:', error.response?.data || error.message);
      throw error;
    }
  },

  // Обновление конфига
  updateConfig: async (id, configData) => {
    try {
      await axios.put(`${API_URL}/${id}`, configData);
    } catch (error) {
      console.error('Error updating config:', error.response?.data || error.message);
      throw error;
    }
  },

  // Удаление конфига
  deleteConfig: async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
    } catch (error) {
      console.error('Error deleting config:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default configService;