import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/restaurants';

const useRestaurantStore = create((set, get) => ({
    restaurants: [],
    isLoading: false,
    error: null,
    isInitialized: false,

    fetchRestaurants: async (force = false) => {
        const { isInitialized, isLoading } = get();
        if (isInitialized && !force) return;
        if (isLoading) return;

        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/my-restaurants`, {
                credentials: 'include'
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch restaurants');
            }
            console.log(data);
            set({ restaurants: data.restaurants || [], isLoading: false, isInitialized: true });
        } catch (error) {
            set({ error: error.message, isLoading: false, isInitialized: true });
        }
    },

    addRestaurant: async (restaurantData) => {
        set({ error: null });
        try {
            const res = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(restaurantData),
                credentials: 'include'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to create restaurant');
            }

            // Update the local state by appending the new restaurant
            set((state) => ({
                restaurants: [...state.restaurants, data.restaurant],
            }));

            return data.restaurant;
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    reset: () => {
        set({ restaurants: [], isInitialized: false, error: null, isLoading: false });
    }
}));

export default useRestaurantStore;
