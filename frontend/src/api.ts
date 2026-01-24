import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Helper to extract error message
export const handleApiError = (error: any, defaultMessage: string = 'Something went wrong') => {
    if (error.response && error.response.data && error.response.data.detail) {
        // detail can be string or array of objects (validation errors)
        const detail = error.response.data.detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) return detail.map((e: any) => e.msg).join(', ');
        return JSON.stringify(detail);
    }
    return defaultMessage;
};

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const status = error.response.status;
            if (status === 401) {
                localStorage.removeItem('token');
                if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                    window.location.href = '/login';
                }
            } else if (status >= 500) {
                // Global handler for server errors
                // We can toast here, but maybe better to let specific queries handle it if they want?
                // For now, let's NOT toast globally for 500 to avoid double toasts if local code handles it.
                console.error("Server Error:", error);
            }
        } else if (error.request) {
            // Network error
            console.error("Network Error:", error);
            // toast.error("Network Error: Please check your connection."); // Requires importing toast, circular dependency risk if we put it here
        }
        return Promise.reject(error);
    }
);

export default api;
