# Mobile app instructions

## Technical stack

- Expo SDK 57 and React Native 0.86
- Expo Router
- Strict TypeScript

Read the exact versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/ before writing Expo code.

## Coding standards

- Use strict TypeScript and avoid `any`.
- Define types for API responses and non-trivial data.
- Prefer functional components and hooks.
- Match the existing naming, formatting, and component patterns.
- Keep comments for complex logic only.

## Data fetching

- Always use TanStack Query for server and API data fetching.
- Wrap each query or mutation in a custom hook under `src/hooks`.
- Keep API request functions separate from components and reusable hooks.
- Handle loading, empty, success, and error states explicitly.
- Validate external API data at the boundary when the response is complex or security-sensitive.
- Keep client-only state separate from server/API state.

## Project structure

- Expo Router screens live under `src/app`.
- Always keep reusable components under `src/components`.
- Follow `mobile/DESIGN.md` for visual and interaction decisions when that file exists.
- Use platform-specific files such as `.native.tsx` or `.web.tsx` only when the behavior genuinely differs.

## Verification

- Run `npm run lint` for linting.
- Run `npx tsc --noEmit` for type checking.
- Run `moon run mobile:android` when the Android native build needs verification.
