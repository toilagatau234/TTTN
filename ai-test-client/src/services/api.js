import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/hydrangea';

export const processText = async (text) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/process`, { text });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'API Error: Backend connection failed');
    }
    throw new Error('Network Error: Could not connect to backend');
  }
};
