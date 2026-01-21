import { useAuthStore } from "../store/authStore";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = useAuthStore.getState().token;

    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        // Optional: auto logout on 401
        // useAuthStore.getState().logout();
    }

    return response;
}
