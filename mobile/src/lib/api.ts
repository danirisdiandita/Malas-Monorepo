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

export interface Recipe {
  image_url?: string;
  notes?: string;
  url?: string;
  rating?: number;
  id: string;
  name: string;
  process_minutes: number;
  servings: number;
  difficulty: string;
  source: string;
  folder_id?: string;
  folder_name?: string;
  tags: string[];
  ingredients: string[];
  instructions: string[];
}

export interface LinkImportResult {
 recipe_id: string;
  aweme_id: string;
  redirected_url: string;
  saved_file: string;
  run_id: string;
}

export interface PhotoImportResult {
  recipe_id: string;
}

export interface ImportStatus {
  run_id: string;
  status: 'looking' | 'making' | 'done' | 'failed';
  recipe_id: string;
  error: string;
  recipes?: ImportedRecipe[];
}

export interface ImportedRecipe {
  id: string;
  name: string;
  image_url?: string;
}

export interface RecipePage {
  items: Recipe[];
  next_page: number;
}

export interface Folder {
  id: string;
  name: string;
}

export interface FolderPage {
  items: Folder[];
  next_page: number;
}

export interface MealCalendarEntry {
  id: string;
  planned_date: string;
  meal_slot: string;
  scheduled_time?: string;
  timezone: string;
  notes?: string;
  recipe_id?: string;
  recipe_name?: string;
  image_url?: string;
}

export interface Grocery {
  id: string;
  name: string;
  unit: string;
  quantity?: number;
  tag?: string;
  recipe_id?: string;
  recipe_name?: string;
  recipe_image_url?: string;
  checked: boolean;
}

const tokenKey = 'malas.jwt';
const refreshTokenKey = 'malas.refresh';
const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080');
const authUrl = process.env.EXPO_PUBLIC_AUTH_URL ?? apiUrl;
let currentUserRequest: Promise<User> | undefined;
let refreshRequest: Promise<string | null> | undefined;

async function authenticatedFetch(path: string, options: RequestInit = {}): Promise<Response> {
 const send = async () => {
  const token = await SecureStore.getItemAsync(tokenKey);
  if (!token) throw new Error('Please sign in again.');
  const headers = new Headers(options.headers);
  headers.set('X-JWT', token);
  if (path === '/auth/user') {
   const refresh = await SecureStore.getItemAsync(refreshTokenKey);
   if (refresh) headers.set('X-Refresh-Token', refresh);
  }
  return fetch(apiUrl + path, { ...options, credentials: 'omit', headers });
 };
 let response = await send();
 if (response.status === 401) {
  if (!await refreshAccessToken()) throw new Error('Your session expired. Please sign in again.');
  response = await send();
 }
 return response;
}

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

export async function getRevenueCatAppUserId(): Promise<string> {
  const response = await authenticatedFetch('/revenuecat/app-user-id', { method: 'POST' });
  if (!response.ok) throw new Error('Unable to create the RevenueCat identity.');
  const body = (await response.json()) as { rc_app_user_id?: unknown };
  if (typeof body.rc_app_user_id !== 'string' || body.rc_app_user_id === '') {
    throw new Error('The API returned an invalid RevenueCat identity.');
  }
  return body.rc_app_user_id;
}

export async function getRecipes(page = 1, search = '', folderID = ''): Promise<RecipePage> {
  const params = new URLSearchParams({ page: String(page), page_size: '5' });
  if (search.trim()) params.set('q', search.trim());
  if (folderID.trim()) params.set('folder_id', folderID.trim());
  const response = await authenticatedFetch(`/recipes?${params.toString()}`);
  if (!response.ok) throw new Error('Unable to load recipes.');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') throw new Error('Invalid recipes response.');
  const pageBody = body as Record<string, unknown>;
  if (!Array.isArray(pageBody.items) || !pageBody.items.every(isRecipe) || typeof pageBody.next_page !== 'number') {
    throw new Error('Invalid recipes response.');
  }
  return pageBody as unknown as RecipePage;
}

function isFolder(value: unknown): value is Folder {
  if (!value || typeof value !== 'object') return false;
  const folder = value as Record<string, unknown>;
  return typeof folder.id === 'string' && typeof folder.name === 'string';
}

export async function getFolders(page = 1, search = ''): Promise<FolderPage> {
  const params = new URLSearchParams({ page: String(page), page_size: '5' });
  if (search.trim()) params.set('q', search.trim());
  const response = await authenticatedFetch(`/folders?${params.toString()}`);
  if (!response.ok) throw new Error('Unable to load folders.');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') throw new Error('Invalid folders response.');
  const pageBody = body as Record<string, unknown>;
  if (!Array.isArray(pageBody.items) || !pageBody.items.every(isFolder) || typeof pageBody.next_page !== 'number') throw new Error('Invalid folders response.');
  return pageBody as unknown as FolderPage;
}

export async function createFolder(name: string): Promise<Folder> {
  const response = await authenticatedFetch('/folders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to create folder.');
  const body: unknown = await response.json();
  if (!isFolder(body)) throw new Error('Invalid folder response.');
  return body;
}

export async function updateFolder(id: string, name: string): Promise<Folder> {
  const response = await authenticatedFetch(`/folders/${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to rename folder.');
  const body: unknown = await response.json();
  if (!isFolder(body)) throw new Error('Invalid folder response.');
  return body;
}

export async function deleteFolder(id: string): Promise<void> {
  const response = await authenticatedFetch(`/folders/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to delete folder.');
}

export async function getRecipe(id: string): Promise<Recipe> {
  const response = await authenticatedFetch(`/recipes/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error('Unable to load recipe.');
  const body: unknown = await response.json();
  if (!isRecipe(body)) throw new Error('Invalid recipe response.');
  return body;
}

export async function rateRecipe(id: string, rating: number): Promise<void> {
  const response = await authenticatedFetch(`/recipes/${encodeURIComponent(id)}/rating`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to save rating.');
}

export async function moveRecipeToFolder(id: string, folderID: string | null): Promise<void> {
  const response = await authenticatedFetch(`/recipes/${encodeURIComponent(id)}/folder`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder_id: folderID }),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to move recipe.');
}

export async function deleteRecipe(id: string, deleteGroceries = false): Promise<void> {
  const response = await authenticatedFetch(`/recipes/${encodeURIComponent(id)}`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delete_groceries: deleteGroceries }),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to delete recipe.');
}

export async function getGroceries(): Promise<Grocery[]> {
  const response = await authenticatedFetch('/groceries');
  if (!response.ok) throw new Error('Unable to load groceries.');
  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every(isGrocery)) throw new Error('Invalid groceries response.');
  return body;
}

export async function getMealCalendar(date: string): Promise<MealCalendarEntry[]> {
  const response = await authenticatedFetch(`/meal-calendar?date=${encodeURIComponent(date)}`);
  if (!response.ok) throw new Error('Unable to load meal plan.');
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error('Invalid meal plan response.');
  return body as MealCalendarEntry[];
}

export async function createMealCalendar(input: { planned_date: string; meal_slot: string; scheduled_time?: string; timezone: string; recipe_id: string }): Promise<MealCalendarEntry> {
  const response = await authenticatedFetch('/meal-calendar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to add meal plan.');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || typeof (body as Record<string, unknown>).id !== 'string') throw new Error('Invalid meal plan response.');
  return body as MealCalendarEntry;
}

export async function addGrocery(input: { name: string; quantity?: number; unit?: string }): Promise<Grocery> {
  const response = await authenticatedFetch('/groceries', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to add grocery.');
  const body: unknown = await response.json();
  if (!isGrocery(body)) throw new Error('Invalid grocery response.');
  return body;
}

export async function parseGroceries(text: string): Promise<{ count: number }> {
  const response = await authenticatedFetch('/groceries/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to parse groceries.');
  return response.json();
}

export async function parseGroceryPhoto(uri: string): Promise<{ count: number }> {
  const form = new FormData();
  form.append('photo', { uri, name: 'groceries.jpg', type: 'image/jpeg' } as unknown as Blob);
  const response = await authenticatedFetch('/groceries/parse-photo', { method: 'POST', body: form });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to parse grocery photo.');
  return response.json();
}

export async function clearGroceries(): Promise<void> {
  const response = await authenticatedFetch('/groceries', { method: 'DELETE' });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to clear groceries.');
}

export async function updateGroceryChecked(id: string, checked: boolean): Promise<void> {
  const response = await authenticatedFetch(`/groceries/${encodeURIComponent(id)}/checked`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checked }) });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to update grocery.');
}

export async function addRecipeIngredients(id: string): Promise<{ count: number }> {
  const response = await authenticatedFetch(`/recipes/${encodeURIComponent(id)}/groceries`, { method: 'POST' });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to add groceries.');
  return response.json();
}

type ImportPreferences = { language_code?: string; folder_id?: string };

export async function importLink(url: string, preferences: ImportPreferences = {}): Promise<LinkImportResult> {
  const response = await authenticatedFetch('/imports/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, ...preferences }),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to process link.');
  const body: unknown = await response.json();
  if (!isLinkImportResult(body)) throw new Error('Invalid link import response.');
  return body;
}

export async function importPhoto(uri: string, preferences: ImportPreferences = {}): Promise<PhotoImportResult> {
  const form = new FormData();
  form.append('photo', { uri, name: 'recipe-photo.jpg', type: 'image/jpeg' } as unknown as Blob);
  if (preferences.language_code) form.append('language_code', preferences.language_code);
  if (preferences.folder_id) form.append('folder_id', preferences.folder_id);
  const response = await authenticatedFetch('/imports/photo', { method: 'POST', body: form });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to process photo.');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || typeof (body as Record<string, unknown>).recipe_id !== 'string') {
    throw new Error('Invalid photo import response.');
  }
  return body as PhotoImportResult;
}

export async function importText(text: string, preferences: ImportPreferences = {}, mode: 'text' | 'ai' = 'text'): Promise<PhotoImportResult> {
  const response = await authenticatedFetch('/imports/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mode, ...preferences }),
  });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to create recipe from text.');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object' || typeof (body as Record<string, unknown>).recipe_id !== 'string') {
    throw new Error('Invalid text import response.');
  }
  return body as PhotoImportResult;
}

export async function getImportStatus(runID: string): Promise<ImportStatus> {
  const response = await authenticatedFetch(`/imports/${encodeURIComponent(runID)}`);
  if (!response.ok) throw new Error((await response.text()) || 'Unable to check import status.');
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') throw new Error('Invalid import status.');
  const v = body as Record<string, unknown>;
  if (typeof v.run_id !== 'string' || typeof v.recipe_id !== 'string' || typeof v.error !== 'string' ||
   !['looking','making','done','failed'].includes(String(v.status))) throw new Error('Invalid import status.');
  return body as ImportStatus;
}

export async function retryImport(runID: string): Promise<void> {
 const response = await authenticatedFetch(`/imports/${encodeURIComponent(runID)}/retry`, {method: 'POST'});
 if (!response.ok) throw new Error((await response.text()) || 'Unable to retry import.');
}

function refreshAccessToken(): Promise<string | null> {
 if (!refreshRequest) refreshRequest = renewSession().finally(() => { refreshRequest = undefined; });
 return refreshRequest;
}

async function renewSession(): Promise<string | null> {
  const refresh = await SecureStore.getItemAsync(refreshTokenKey);
  if (!refresh) return null;
  const response = await fetch(`${apiUrl}/auth/refresh`, {
    method: 'POST',
    credentials: 'omit',
    headers: { 'X-Refresh-Token': refresh },
  });
  if (!response.ok) return null;
  const session = (await response.json()) as { access_token?: string; refresh_token?: string };
  if (!session.access_token || !session.refresh_token) return null;
  await storeToken(session.access_token);
  await storeRefreshToken(session.refresh_token);
  const synced = await fetch(`${apiUrl}/auth/user`, { credentials: 'omit',
   headers: { 'X-JWT': session.access_token, 'X-Refresh-Token': session.refresh_token } });
  if (!synced.ok) throw new Error('Unable to restore your session.');
  return session.access_token;
}

function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== 'object') return false;
  const recipe = value as Record<string, unknown>;
  return typeof recipe.id === 'string' && typeof recipe.name === 'string' && typeof recipe.process_minutes === 'number' && typeof recipe.servings === 'number' && typeof recipe.difficulty === 'string' && typeof recipe.source === 'string' && Array.isArray(recipe.tags) && recipe.tags.every((tag) => typeof tag === 'string') && Array.isArray(recipe.ingredients) && recipe.ingredients.every((ingredient) => typeof ingredient === 'string') && Array.isArray(recipe.instructions) && recipe.instructions.every((instruction) => typeof instruction === 'string');
}

function isGrocery(value: unknown): value is Grocery {
  if (!value || typeof value !== 'object') return false;
  const grocery = value as Record<string, unknown>;
  return typeof grocery.id === 'string' && typeof grocery.name === 'string' && typeof grocery.unit === 'string' && typeof grocery.checked === 'boolean' && (grocery.quantity === undefined || typeof grocery.quantity === 'number') && (grocery.tag === undefined || typeof grocery.tag === 'string') && (grocery.recipe_id === undefined || typeof grocery.recipe_id === 'string') && (grocery.recipe_name === undefined || typeof grocery.recipe_name === 'string') && (grocery.recipe_image_url === undefined || typeof grocery.recipe_image_url === 'string');
}

function isLinkImportResult(value: unknown): value is LinkImportResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return typeof result.aweme_id === 'string' && typeof result.redirected_url === 'string' && typeof result.saved_file === 'string' && typeof result.run_id === 'string' && typeof result.recipe_id === 'string';
}

async function loadCurrentUser(): Promise<User> {
  const response = await authenticatedFetch('/auth/user');
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

export async function deleteAccount() {
  const response = await authenticatedFetch('/account', { method: 'DELETE' });
  if (!response.ok) throw new Error((await response.text()) || 'Unable to delete account.');
}
