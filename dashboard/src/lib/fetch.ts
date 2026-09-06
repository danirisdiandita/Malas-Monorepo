import { useAuthStore } from "../store/authStore";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const { logout } = useAuthStore.getState();

    const headers = {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
        ...options.headers,
    } as Record<string, string>;

    let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important for cookies
    });

    // Rotate the refresh cookie once, then retry the original request.
    if (response.status === 401) {
        const refreshed = await fetch(`${new URL(url).origin}/auth/refresh`, {
            method: 'POST',
            headers: { 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') },
            credentials: 'include',
        });
        if (refreshed.ok) {
            response = await fetch(url, {
                ...options,
                headers: { ...headers, 'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') },
                credentials: 'include',
            });
        } else {
            logout();
        }
    }

    if (response.status === 401) logout();

    return response;
}

function getCookie(name: string) {
    return document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`))?.split('=').slice(1).join('=') ?? '';
}
