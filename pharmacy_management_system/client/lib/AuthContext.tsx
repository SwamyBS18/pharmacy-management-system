/**
 * Authentication Context
 * Global state management for authentication
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'EMPLOYEE';
    pharmacy_id: number;
    pharmacy_name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                try {
                    // Verify token is still valid
                    const response = await api.auth.getCurrentUser();
                    setUser(response.data);
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await api.auth.login({ email, password });
            const { user: userData, token: authToken } = response.data;

            // Store in localStorage
            localStorage.setItem('auth_token', authToken);
            localStorage.setItem('user', JSON.stringify(userData));

            // Update state
            setToken(authToken);
            setUser(userData);
        } catch (error: any) {
            throw new Error(error.response?.data?.error || 'Login failed');
        }
    };

    const logout = () => {
        // Call logout API (optional, to invalidate token on server)
        api.auth.logout().catch(() => {
            // Ignore errors, just clear local state
        });

        // Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');

        // Clear state
        setToken(null);
        setUser(null);

        // Redirect to login
        window.location.href = '/login';
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
