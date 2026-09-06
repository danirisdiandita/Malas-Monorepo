import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export type AuthProvider = 'google' | 'apple';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

const tokenKey = 'malas.jwt';
const refreshTokenKey = 'malas.refresh';
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
const authUrl = process.env.EXPO_PUBLIC_AUTH_URL ?? apiUrl;
let currentUserRequest: Promise<User> | undefined;

export async function storeToken(token: string) {
  await SecureStore.setItemAsync(tokenKey, token);
}

async function storeRefreshToken(token: string) {
  await SecureStore.setItemAsync(refreshTokenKey, token);
}

export async function signIn(provider: AuthProvider): Promise<User> {
  const redirectUri = Linking.createURL('auth/callback', { scheme: 'mobile' });
  const result = await WebBrowser.openAuthSessionAsync(
    `${authUrl}/auth/${provider}/login?from=${encodeURIComponent(redirectUri)}`,
    redirectUri,
  );

  if (result.type !== 'success') {
    throw new Error('Sign in was cancelled.');
  }

  WebBrowser.dismissBrowser();

  const token = Linking.parse(result.url).queryParams?.token;
  if (typeof token !== 'string' || token === '') {
    throw new Error('The API did not return an authentication token.');
  }

  await storeToken(token);
  return getCurrentUser();
}

export function getCurrentUser(): Promise<User> {
  if (!currentUserRequest) {
    currentUserRequest = loadCurrentUser().finally(() => {
      currentUserRequest = undefined;
    });
  }
  return currentUserRequest;
}

async function loadCurrentUser(): Promise<User> {
  const token = await SecureStore.getItemAsync(tokenKey);
  if (!token) {
    throw new Error('Not signed in.');
  }

  const refresh = await SecureStore.getItemAsync(refreshTokenKey);
  let response = await fetch(`${apiUrl}/auth/user`, {
    headers: {
      'X-JWT': token,
      ...(refresh ? { 'X-Refresh-Token': refresh } : {}),
    },
  });
  if (response.status === 401) {
    if (refresh) {
      const refreshed = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'X-Refresh-Token': refresh },
      });
      if (refreshed.ok) {
        const session = (await refreshed.json()) as { access_token?: string; refresh_token?: string };
        if (session.access_token && session.refresh_token) {
          await storeToken(session.access_token);
          await storeRefreshToken(session.refresh_token);
          response = await fetch(`${apiUrl}/auth/user`, {
            headers: { 'X-JWT': session.access_token, 'X-Refresh-Token': session.refresh_token },
          });
        }
      }
    }
  }
  if (!response.ok) {
    if (response.status === 401) await signOut();
    throw new Error('Unable to load the signed-in user.');
  }
  const body = (await response.json()) as User & { refresh_token?: string };
  if (body.refresh_token) await storeRefreshToken(body.refresh_token);
  return body;
}

export async function signOut() {
  const token = await SecureStore.getItemAsync(tokenKey);
  const refresh = await SecureStore.getItemAsync(refreshTokenKey);
  if (token || refresh) {
    await fetch(`${apiUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        ...(token ? { 'X-JWT': token } : {}),
        ...(refresh ? { 'X-Refresh-Token': refresh } : {}),
      },
    }).catch(() => undefined);
  }
  await SecureStore.deleteItemAsync(tokenKey);
  await SecureStore.deleteItemAsync(refreshTokenKey);
}
