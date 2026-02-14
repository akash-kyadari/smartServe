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

    // Get restaurant by ID from cache or fetch it
    fetchRestaurantById: async (id, forceRefresh = false) => {
        const state = get();
        const now = Date.now();

        // Return from cache if we already have it and it's fresh enough (optional: could use different duration for single item)
        const cached = state.restaurants.find(r => r._id === id);
        if (!forceRefresh && cached && state.lastFetched && (now - state.lastFetched < state.CACHE_DURATION)) {
            console.log(`Using cached data for restaurant: ${id}`);
            return cached;
        }

        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/restaurants/public/${id}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch restaurant details');
            }

            const data = await response.json();
            const restaurant = data.restaurant;

            set((state) => {
                const existingIndex = state.restaurants.findIndex(r => r._id === id);
                let newRestaurants;
                if (existingIndex !== -1) {
                    newRestaurants = [...state.restaurants];
                    newRestaurants[existingIndex] = restaurant;
                } else {
                    newRestaurants = [...state.restaurants, restaurant];
                }
                return {
                    restaurants: newRestaurants,
                    isLoading: false,
                    error: null
                };
            });

            return restaurant;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    // Get restaurant by ID from current local state only
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
