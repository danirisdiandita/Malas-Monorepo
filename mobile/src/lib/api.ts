import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export type AuthProvider = 'google' | 'apple';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

const tokenKey = 'malas.jwt';
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');

export async function signIn(provider: AuthProvider): Promise<User> {
  const redirectUri = Linking.createURL('auth/callback');
  const result = await WebBrowser.openAuthSessionAsync(
    `${apiUrl}/auth/${provider}/login?from=${encodeURIComponent(redirectUri)}`,
    redirectUri,
  );

  if (result.type !== 'success') {
    throw new Error('Sign in was cancelled.');
  }

  const token = Linking.parse(result.url).queryParams?.token;
  if (typeof token !== 'string' || token === '') {
    throw new Error('The API did not return an authentication token.');
  }

  await SecureStore.setItemAsync(tokenKey, token);
  return getCurrentUser();
}

export async function getCurrentUser(): Promise<User> {
  const token = await SecureStore.getItemAsync(tokenKey);
  if (!token) {
    throw new Error('Not signed in.');
  }

  const response = await fetch(`${apiUrl}/auth/user`, {
    headers: { 'X-JWT': token },
  });
  if (!response.ok) {
    throw new Error('Unable to load the signed-in user.');
  }

  return response.json() as Promise<User>;
}

export async function signOut() {
  await SecureStore.deleteItemAsync(tokenKey);
}
