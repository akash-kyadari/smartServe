import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

const useRestaurantsListStore = create((set, get) => ({
    restaurants: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

    // Fetch restaurants with caching
    fetchRestaurants: async (forceRefresh = false) => {
        const state = get();
        const now = Date.now();

        // Return cached data if still valid and not forcing refresh
        if (!forceRefresh && state.restaurants.length > 0 && state.lastFetched) {
            const cacheAge = now - state.lastFetched;
            if (cacheAge < state.CACHE_DURATION) {
                console.log('Using cached restaurants data');
                return state.restaurants;
            }
        }

        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/restaurants`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch restaurants');
            }

            const data = await response.json();
            set({
                restaurants: data.restaurants || [],
                isLoading: false,
                lastFetched: now,
                error: null,
            });

            return data.restaurants || [];
        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
            });
            throw error;
        }
    },

    // Get restaurant by ID from cache
    getRestaurantById: (id) => {
        const state = get();
        return state.restaurants.find(r => r._id === id);
    },

    // Update a specific restaurant in the cache
    updateRestaurant: (id, updates) => {
        set((state) => ({
            restaurants: state.restaurants.map(r =>
                r._id === id ? { ...r, ...updates } : r
            ),
        }));
    },

    // Clear cache
    clearCache: () => {
        set({
            restaurants: [],
            lastFetched: null,
            error: null,
        });
    },

    // Reset store
    reset: () => {
        set({
            restaurants: [],
            isLoading: false,
            error: null,
            lastFetched: null,
        });
    },
}));

export default useRestaurantsListStore;
