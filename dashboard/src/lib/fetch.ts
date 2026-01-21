import { useAuthStore } from "../store/authStore";
import { config } from "./config";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const { token, refreshToken, setToken, logout } = useAuthStore.getState();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as Record<string, string>;

    let response = await fetch(url, { ...options, headers });

    // Handle Token Expiry
    if (response.status === 401 && refreshToken) {
        try {
            const refreshResponse = await fetch(`${config.apiUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
                const { accessToken } = await refreshResponse.json();
                setToken(accessToken);

                // Retry original request with new token
                headers['Authorization'] = `Bearer ${accessToken}`;
                response = await fetch(url, { ...options, headers });
            } else {
                // Refresh token invalid or expired
                logout();
            }
        } catch (error) {
            logout();
        }
    }

    return response;
}

