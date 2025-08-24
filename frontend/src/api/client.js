import axios from 'axios';

// Create an Axios instance with a pre-configured base URL.
// We are now using the environment variable we defined.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;