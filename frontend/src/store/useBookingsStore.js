import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

const useBookingsStore = create((set, get) => ({
    bookings: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    CACHE_DURATION: 2 * 60 * 1000, // 2 minutes (shorter for bookings)

    // Fetch bookings with caching
    fetchBookings: async (forceRefresh = false) => {
        const state = get();
        const now = Date.now();

        // Return cached data if still valid and not forcing refresh
        if (!forceRefresh && state.bookings.length > 0 && state.lastFetched) {
            const cacheAge = now - state.lastFetched;
            if (cacheAge < state.CACHE_DURATION) {
                console.log('Using cached bookings data');
                return state.bookings;
            }
        }

        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/bookings`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }

            const data = await response.json();
            set({
                bookings: data.bookings || [],
                isLoading: false,
                lastFetched: now,
                error: null,
            });

            return data.bookings || [];
        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
            });
            throw error;
        }
    },

    // Create a new booking
    createBooking: async (bookingData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(bookingData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create booking');
            }

            const data = await response.json();

            // Add new booking to the store
            set((state) => ({
                bookings: [data.booking, ...state.bookings],
                isLoading: false,
                error: null,
            }));

            return data.booking;
        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
            });
            throw error;
        }
    },

    // Cancel a booking
    cancelBooking: async (bookingId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to cancel booking');
            }

            // Remove booking from store
            set((state) => ({
                bookings: state.bookings.filter(b => b._id !== bookingId),
                isLoading: false,
                error: null,
            }));

            return true;
        } catch (error) {
            set({
                error: error.message,
                isLoading: false,
            });
            throw error;
        }
    },

    // Update booking status (for real-time updates)
    updateBookingStatus: (bookingId, status) => {
        set((state) => ({
            bookings: state.bookings.map(b =>
                b._id === bookingId ? { ...b, status } : b
            ),
        }));
    },

    // Add a new booking (for real-time socket updates)
    addBooking: (booking) => {
        set((state) => {
            // Check if booking already exists
            const exists = state.bookings.some(b => b._id === booking._id);
            if (exists) {
                return state;
            }
            return {
                bookings: [booking, ...state.bookings],
            };
        });
    },

    // Remove booking (for real-time socket updates)
    removeBooking: (bookingId) => {
        set((state) => ({
            bookings: state.bookings.filter(b => b._id !== bookingId),
        }));
    },

    // Clear cache
    clearCache: () => {
        set({
            bookings: [],
            lastFetched: null,
            error: null,
        });
    },

    // Reset store
    reset: () => {
        set({
            bookings: [],
            isLoading: false,
            error: null,
            lastFetched: null,
        });
    },
}));

export default useBookingsStore;
