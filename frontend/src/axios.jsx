import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve();
    });
    failedQueue = [];
}

// Interceptor to automatically refresh token on 401 responses
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        const isAuthEndpoint = ["/refresh", "/signin", "/me", "/signout"].includes(originalRequest.url);

        if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api.request(originalRequest))
                    .catch(err => Promise.reject(err));
            }

            isRefreshing = true;
            originalRequest._retry = true;

            try {
                await api.post('/refresh');
                processQueue(null);
                isRefreshing = false;
                return api.request(originalRequest);
            } catch (err) {
                processQueue(err);
                isRefreshing = false;
                window.location.href = '/signin';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;