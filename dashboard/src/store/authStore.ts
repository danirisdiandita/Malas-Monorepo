import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string;
    email: string;
    name: string;
    picture: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setAuth: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            setAuth: (user: User) => set({ user, isAuthenticated: true }),
            logout: () => set({ user: null, isAuthenticated: false }),
        }),


        {
            name: 'auth-storage',
        }
    )
)

// Convenient hook for session data
export function useSession() {
    const { user, isAuthenticated, logout } = useAuthStore()
    return { user, isAuthenticated, logout }
}
