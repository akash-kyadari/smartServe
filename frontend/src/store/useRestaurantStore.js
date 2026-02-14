import { create } from 'zustand';
import useAuthStore from './useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api/restaurants';

const useRestaurantStore = create((set, get) => ({
    restaurants: [],
    isLoading: false,
    error: null,
    isInitialized: false,
    dashboardData: {}, // { [restaurantId]: { orders: [], analytics: {}, lastUpdated: 0 } }
    activeRequests: {}, // Map of id -> Promise for deduplication

    setDashboardData: (id, data) => set(state => ({
        dashboardData: {
            ...state.dashboardData,
            [id]: { ...state.dashboardData[id], ...data, lastUpdated: Date.now() }
        }
    })),

    fetchRestaurants: async (force = false) => {
        const { isInitialized, isLoading, activeRequests, restaurants } = get();

        // Return existing promise if in flight
        if (activeRequests['all']) return activeRequests['all'];

        // If initialized and not forcing refresh, return
        if (isInitialized && !force && restaurants.length > 0) return;

        // Ensure no other blocking loading state prevents this if we really want to fetch
        // (isLoading is global so might block specific fetches if used broadly, but here fine)

        // Security check: Only owners should call this endpoint
        const { user } = useAuthStore.getState();
        if (!user || !user.roles.includes('owner')) {
            console.warn("Blocked fetchRestaurants call: User is not an owner.");
            return;
        }

        const promise = (async () => {
            set({ isLoading: true, error: null });
            try {
                const res = await fetch(`${API_URL}/my-restaurants`, {
                    credentials: 'include'
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Failed to fetch restaurants');
                }

                set({ restaurants: data.restaurants || [], isLoading: false, isInitialized: true });
                return data.restaurants;
            } catch (error) {
                set({ error: error.message, isLoading: false, isInitialized: true });
                throw error;
            } finally {
                set(state => {
                    const newRequests = { ...state.activeRequests };
                    delete newRequests['all'];
                    return { activeRequests: newRequests };
                });
            }
        })();

        set(state => ({ activeRequests: { ...state.activeRequests, 'all': promise } }));
        return promise;
    },

    fetchRestaurantById: async (id, force = false) => {
        const { restaurants, isLoading, activeRequests } = get();

        // Return existing promise if in flight
        if (activeRequests[id]) return activeRequests[id];

        // If we already have the restaurant and not forcing refresh, skip
        const cached = restaurants.find(r => r._id === id);
        if (!force && cached) {
            return Promise.resolve({ restaurant: cached });
        }

        const promise = (async () => {
            set({ isLoading: true, error: null });
            try {
                const res = await fetch(`${API_URL}/${id}`, {
                    credentials: 'include'
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Failed to fetch restaurant');
                }

                // Update or add the fetched restaurant to the list
                set((state) => {
                    const existingIndex = state.restaurants.findIndex(r => r._id === id);
                    let newRestaurants;
                    if (existingIndex !== -1) {
                        newRestaurants = [...state.restaurants];
                        newRestaurants[existingIndex] = data.restaurant;
                    } else {
                        newRestaurants = [...state.restaurants, data.restaurant];
                    }
                    return { restaurants: newRestaurants, isLoading: false };
                });
                return data;
            } catch (error) {
                set({ error: error.message, isLoading: false });
                throw error;
            } finally {
                set(state => {
                    const newRequests = { ...state.activeRequests };
                    delete newRequests[id];
                    return { activeRequests: newRequests };
                });
            }
        })();

        set(state => ({ activeRequests: { ...state.activeRequests, [id]: promise } }));
        return promise;
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

    toggleStaffStatus: async (restaurantId, staffId, isActive) => {
        set({ error: null });
        try {
            const res = await fetch(`${API_URL}/${restaurantId}/staff/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffId, active: isActive }),
                credentials: 'include'
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update status');
            }

            // Update local state
            set((state) => ({
                restaurants: state.restaurants.map(r => {
                    if (r._id === restaurantId) {
                        return {
                            ...r,
                            staff: (r.staff || []).map(s => {
                                const sUserId = s.user?._id || s.user;
                                if (sUserId === staffId) {
                                    return { ...s, isActive: isActive }; // Optimistic update
                                }
                                return s;
                            })
                        };
                    }
                    return r;
                })
            }));

            return data;
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // OPTIMIZED: Update local staff status without re-fetching
    setStaffActiveStatus: (restaurantId, staffId, isActive) => {
        set((state) => ({
            restaurants: state.restaurants.map(r => {
                if (r._id === restaurantId) {
                    return {
                        ...r,
                        staff: (r.staff || []).map(s => {
                            const sUserId = s.user?._id || s.user;
                            /* 
                               Warning: staffId coming from socket might be string, sUserId might be object id.
                               Ensure flexible comparison.
                            */
                            if (sUserId && sUserId.toString() === staffId.toString()) {
                                return { ...s, isActive: isActive };
                            }
                            return s;
                        })
                    };
                }
                return r;
            })
        }));
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
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

    // Table Actions
    updateTableStatus: (restaurantId, tableId, updates) => {
        set((state) => ({
            restaurants: state.restaurants.map(r => {
                if (r._id === restaurantId) {
                    return {
                        ...r,
                        tables: (r.tables || []).map(t =>
                            t._id === tableId ? { ...t, ...updates } : t
                        )
                    };
                }
                return r;
            })
        }));
    },

    // Clear error
    clearError: () => set({ error: null }),

    reset: () => {
        set({ restaurants: [], isInitialized: false, error: null, isLoading: false });
    }
}));

export default useRestaurantStore;
