import axios from 'axios';
import { apiBaseURL } from '../lib/config';
const apiClient = axios.create({ baseURL: apiBaseURL, withCredentials: true });
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.dispatchEvent(new Event('hrgms:session-expired'));
    }
    // Do not replay mutations such as payments or bookings automatically.
    return Promise.reject(error);
  },
);
export default apiClient;
