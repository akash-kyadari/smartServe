import { create } from 'zustand';
import useAuthStore from './useAuthStore';

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

        // Security check: Only owners should call this endpoint
        const { user } = useAuthStore.getState();
        if (!user || !user.roles.includes('owner')) {
            console.warn("Blocked fetchRestaurants call: User is not an owner.");
            return;
        }

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

    fetchRestaurantById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                credentials: 'include'
            });
            const data = await res.json();

            if (!res.ok) {
                // If 403 or 404, we might want to handle it, but for now just throw
                throw new Error(data.message || 'Failed to fetch restaurant');
            }

            // Replace restaurants list with just this one, effectively acting as "my restaurants" for staff
            set({ restaurants: [data.restaurant], isLoading: false, isInitialized: true });
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

    updateRestaurant: async (id, updates) => {
        set({ error: null });
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
                credentials: 'include'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to update restaurant');
            }

            // Update local state
            set((state) => ({
                restaurants: state.restaurants.map(r => r._id === id ? data.restaurant : r)
            }));

            return data.restaurant;
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // Staff Actions
    addStaffMember: async (restaurantId, staffData) => {
        set({ error: null });
        try {
            const res = await fetch(`${API_URL}/${restaurantId}/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(staffData),
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to add staff');

            // Update the restaurant's staff array
            set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r._id === restaurantId) {
                        return { ...r, staff: [...(r.staff || []), data.staff] };
                    }
                    return r;
                })
            }));
            return data.staff;
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    removeStaffMember: async (restaurantId, staffId) => {
        set({ error: null });
        try {
            const res = await fetch(`${API_URL}/${restaurantId}/staff/${staffId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to remove staff');
            }

            // Update the restaurant's staff array
            set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r._id === restaurantId) {
                        return {
                            ...r,
                            staff: (r.staff || []).filter(s => {
                                const sUserId = s.user?._id || s.user;
                                return sUserId !== staffId;
                            })
                        };
                    }
                    return r;
                })
            }));
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    updateStaffPassword: async (restaurantId, staffId, newPassword) => {
        set({ error: null });
        try {
            const res = await fetch(`${API_URL}/${restaurantId}/staff/${staffId}/password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword }),
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update password');
            }
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // Menu Actions
    addMenuItem: async (restaurantId, itemData) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/${restaurantId}/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData),
                credentials: 'include'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to add menu item');
            }

            const newItem = data.menuItem;

            // Update the restaurant's menu array
            set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r._id === restaurantId) {
                        return { ...r, menu: [...(r.menu || []), newItem] };
                    }
                    return r;
                }),
                isLoading: false
            }));

            return newItem;
        } catch (error) {
            set({
                error: error.message || 'Failed to add menu item',
                isLoading: false
            });
            throw error;
        }
    },

    updateMenuItem: async (restaurantId, itemId, updates) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/${restaurantId}/menu/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
                credentials: 'include'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to update menu item');
            }

            const updatedItem = data.menuItem;

            // Update the restaurant's menu array
            set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r._id === restaurantId) {
                        return {
                            ...r,
                            menu: (r.menu || []).map(item =>
                                item._id === itemId ? updatedItem : item
                            )
                        };
                    }
                    return r;
                }),
                isLoading: false
            }));

            return updatedItem;
        } catch (error) {
            set({
                error: error.message || 'Failed to update menu item',
                isLoading: false
            });
            throw error;
        }
    },

    deleteMenuItem: async (restaurantId, itemId) => {
        set({ isLoading: true, error: null });
        try {
            const res = await fetch(`${API_URL}/${restaurantId}/menu/${itemId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete menu item');
            }

            // Update the restaurant's menu array
            set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r._id === restaurantId) {
                        return {
                            ...r,
                            menu: (r.menu || []).filter(item => item._id !== itemId)
                        };
                    }
                    return r;
                }),
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error.message || 'Failed to delete menu item',
                isLoading: false
            });
            throw error;
        }
    },

    toggleMenuItemAvailability: async (restaurantId, itemId) => {
        set({ error: null });
        try {
            const res = await fetch(`${API_URL}/${restaurantId}/menu/${itemId}/toggle`, {
                method: 'PATCH',
                credentials: 'include'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to toggle availability');
            }

            const updatedItem = data.menuItem;

            // Update the restaurant's menu array
            set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r._id === restaurantId) {
                        return {
                            ...r,
                            menu: (r.menu || []).map(item =>
                                item._id === itemId ? updatedItem : item
                            )
                        };
                    }
                    return r;
                })
            }));

            return updatedItem;
        } catch (error) {
            set({ error: error.message || 'Failed to toggle availability' });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: null }),

    reset: () => {
        set({ restaurants: [], isInitialized: false, error: null, isLoading: false });
    }
}));

export default useRestaurantStore;
