import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
});

let isRefreshing = false;

// Interceptor to automatically refresh token on 401 responses
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        const isAuthEndpoint = ["/refresh", "/signin", "/me"].includes(originalRequest.url)

        // Try to refresh token if 401 error occurs
        if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
            if (isRefreshing) return Promise.reject(error);
            isRefreshing = true;
            originalRequest._retry = true;
            try {
                await api.post('/refresh');
                isRefreshing = false;
                console.log("Token refreshed successfully");
                return api.request(originalRequest);
            } catch {
                isRefreshing = false;
                window.location.href = '/signin';
            }
        }
        return Promise.reject(error);
    }
);

export default api;