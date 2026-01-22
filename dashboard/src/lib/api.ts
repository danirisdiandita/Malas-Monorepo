import { fetchWithAuth } from "./fetch";
import { config } from "./config";

export interface User {
    id: number;
    email: string;
    name: string;
    picture: string;
}

export const api = {
    getMe: async (): Promise<User> => {
        const res = await fetchWithAuth(`${config.apiUrl}/me`);
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
    },
};
