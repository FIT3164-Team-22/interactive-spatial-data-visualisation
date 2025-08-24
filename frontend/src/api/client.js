import axios from 'axios';

// No need for the full URL anymore. Nginx will handle routing.
const apiClient = axios.create({
  baseURL: '/', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;