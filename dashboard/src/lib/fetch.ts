import { useAuthStore } from "../store/authStore";
import { config } from "./config";

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

    // Handle Token Expiry
    if (response.status === 401) {
        try {
            const refreshResponse = await fetch(`${config.apiUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            if (refreshResponse.ok) {
                // Retry original request as the access_token cookie is now updated
                response = await fetch(url, {
                    ...options,
                    headers,
                    credentials: 'include'
                });
            } else {
                logout();
            }
        } catch (error) {
            logout();
        }
    }

    return response;
}


