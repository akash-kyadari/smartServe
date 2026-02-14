import { create } from 'zustand';
import useRestaurantStore from './useRestaurantStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/auth';

const useAuthStore = create((set, get) => ({
    user: null,
    isAuthenticated: false,
    isCheckingAuth: false,
    error: null,
    isLoading: true, // Start true to prevent premature redirects while checking auth

    signup: async (name, email, password, role) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password, role }),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error signing up');
            }

            set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    login: async (email, password, role) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, role }),
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error logging in');
            }

            set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null });
        try {
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            set({ user: null, isAuthenticated: false, isLoading: false });
            useRestaurantStore.getState().reset();

            // Redirect to home page
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    checkAuth: async () => {
        // Prevent multiple simultaneous auth checks
        if (get().isCheckingAuth) return;

        set({ isCheckingAuth: true, isLoading: true });
        try {
            const response = await fetch(`${API_URL}/me`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message);
            }
            set({ user: data.user, isAuthenticated: true, isLoading: false, isCheckingAuth: false });
        } catch (error) {
            set({ user: null, isAuthenticated: false, isLoading: false, isCheckingAuth: false });
        }
    },

    setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

export default useAuthStore;
