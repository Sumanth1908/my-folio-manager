import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api';
import type { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get<User>('/auth/me');
                    setUser(res.data);
                } catch (error) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem('token');
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        try {
            const res = await api.post<{ access_token: string }>('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const token = res.data.access_token;
            localStorage.setItem('token', token);

            // Fetch user details immediately
            const userRes = await api.get<User>('/auth/me');
            setUser(userRes.data);

            toast.success('Welcome back!');
        } catch (error: any) {
            console.error("Login failed", error);
            const msg = error.response?.data?.detail || 'Login failed';
            toast.error(msg);
            throw error;
        }
    };

    const register = async (email: string, password: string, fullName: string) => {
        try {
            await api.post('/auth/register', { email, password, full_name: fullName });
            // Auto login after register? Or ask to login.
            // Let's ask to login for simplicity or auto-login.
            // For better UX, let's login automatically.
            await login(email, password);
            toast.success('Account created successfully!');
        } catch (error: any) {
            console.error("Registration failed", error);
            const msg = error.response?.data?.detail || 'Registration failed';
            toast.error(msg);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        toast.success('Logged out');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
