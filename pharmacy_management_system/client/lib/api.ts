/**
 * API Client with JWT Token Handling
 * Axios instance with interceptors for authentication
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401 errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');

            // Redirect to login if not already there
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;

// API helper functions
export const api = {
    // Auth endpoints
    auth: {
        checkPharmacy: () => apiClient.get('/auth/check-pharmacy'),
        registerPharmacy: (data: { pharmacy_name: string; email: string; password: string }) =>
            apiClient.post('/auth/register-pharmacy', data),
        completeProfile: (data: { address: string; phone: string; license_number?: string; gst_number?: string }) =>
            apiClient.post('/auth/complete-profile', data),
        login: (data: { email: string; password: string }) => apiClient.post('/auth/login', data),
        logout: () => apiClient.post('/auth/logout'),
        getCurrentUser: () => apiClient.get('/auth/me'),
        changePassword: (data: { current_password: string; new_password: string }) =>
            apiClient.post('/auth/change-password', data),
    },

    // Pharmacy endpoints
    pharmacy: {
        getProfile: () => apiClient.get('/pharmacy/profile'),
        updateProfile: (data: any) => apiClient.put('/pharmacy/profile', data),
    },

    // User endpoints
    users: {
        getAll: () => apiClient.get('/users'),
        getById: (id: number) => apiClient.get(`/users/${id}`),
        create: (data: any) => apiClient.post('/users', data),
        update: (id: number, data: any) => apiClient.put(`/users/${id}`, data),
        activate: (id: number) => apiClient.post(`/users/${id}/activate`),
        deactivate: (id: number) => apiClient.post(`/users/${id}/deactivate`),
        delete: (id: number) => apiClient.delete(`/users/${id}`),
    },

    // Other endpoints (existing)
    medicines: {
        getAll: (params?: any) => apiClient.get('/medicines', { params }),
        getById: (id: number) => apiClient.get(`/medicines/${id}`),
        create: (data: any) => apiClient.post('/medicines', data),
        update: (id: number, data: any) => apiClient.put(`/medicines/${id}`, data),
        delete: (id: number) => apiClient.delete(`/medicines/${id}`),
    },

    inventory: {
        getAll: (params?: any) => apiClient.get('/inventory', { params }),
        getExpired: () => apiClient.get('/inventory/expired'),
        getOutOfStock: () => apiClient.get('/inventory/out-of-stock'),
    },

    sales: {
        getAll: (params?: any) => apiClient.get('/sales', { params }),
        getStatsSummary: (params?: any) => apiClient.get('/sales/stats/summary', { params }),
        create: (data: any) => apiClient.post('/sales', data),
    },

    dashboard: {
        getStats: () => apiClient.get('/dashboard/stats'),
        getAlerts: () => apiClient.get('/dashboard/alerts'),
    },

    billing: {
        generateInvoice: (data: any) => apiClient.post('/billing/invoice', data),
        getInvoices: (params: any) => apiClient.get('/billing/invoices', { params }),
    },

    predictions: {
        getForecast: (id: number, days = 30) => apiClient.get(`/predictions/medicine/${id}/forecast`, { params: { days } }),
        getSeasonalDemand: (season: string, limit = 10) => apiClient.get('/predictions/seasonal-demand', { params: { season, limit } }),
        getReorderRecommendations: () => apiClient.get('/predictions/reorder-recommendations'),
        getExpiryAlerts: (days = 90) => apiClient.get('/predictions/expiry-alerts', { params: { days } }),
        getSalesAnalytics: (period = 30) => apiClient.get('/predictions/sales-analytics', { params: { period } }),
    },
};
