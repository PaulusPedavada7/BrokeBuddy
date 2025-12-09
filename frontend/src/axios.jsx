import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
});

// Interceptor to automatically refresh token on 401 responses
api.interceptors.response.use(
    response => response,
    async error => {
        // Try to refresh token if 401 error occurs
        if (error.respone.status === 401) {
            try {
                await api.post('/refresh-token');
                return api.request(error.config); // Retry original request
            } catch (refreshError) {
                // Redirect to signin if refresh fails
                window.location.href = '/signin';
            }
        }
        return Promise.reject(error);
    }
);

export default api;