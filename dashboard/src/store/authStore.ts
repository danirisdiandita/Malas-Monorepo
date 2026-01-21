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
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string, refreshToken: string) => void;
    setToken: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            setAuth: (user: User, token: string, refreshToken: string) => set({ user, token, refreshToken, isAuthenticated: true }),
            setToken: (token: string) => set({ token }),
            logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
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
