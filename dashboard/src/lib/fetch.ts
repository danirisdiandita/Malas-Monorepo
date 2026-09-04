import { useAuthStore } from "../store/authStore";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const { logout } = useAuthStore.getState();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    } as Record<string, string>;

    let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important for cookies
    });

    // Handle expired or invalid auth cookies.
    if (response.status === 401) {
        logout();
    }

    return response;
}
