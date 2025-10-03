import axios from 'axios'
import { API_PREFIX } from '../config'

const apiHost = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const baseURL = `${apiHost}${API_PREFIX}` || API_PREFIX

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.message) {
      const normalized = new Error(error.response.data.message)
      normalized.response = error.response
      throw normalized
    }
    throw error
  },
)

export default apiClient
