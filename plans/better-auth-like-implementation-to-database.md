# Better Auth-like database authentication

## Objective

Persist Google and Apple identities in PostgreSQL while keeping the existing Go API, Ent, `go-pkgz/auth`, and frontend OAuth flow.

After a successful OAuth callback, the API must create or update a local user, link the provider account, create a revocable session, and expose the local user through `/auth/user` and `/me`.

## Current state

- `go-pkgz/auth` handles OAuth, provider verification, JWT cookies, and XSRF cookies.
- Google and optional Apple providers are registered in `api/cmd/api/main.go`.
- `api/ent/schema/user.go` only has `google_id`, so Apple and multiple providers are not modeled.
- The successful OAuth flow does not call `client.User.Create()` or `client.User.Update()`.
- `/auth/user` returns the provider user from the auth cookie, not a database user.
- The frontend redirects successful login to `/dashboard` and checks `/auth/user`.

## Target data model

### User

Keep one local user per real person:

- `id` — existing local primary key
- `name`
- `email` — unique
- `email_verified`
- `picture` or `image`
- `created_at`
- `updated_at`

Remove `google_id` after migration, or keep it temporarily during a backwards-compatible migration.

### Account

Create an `accounts` Ent schema:

- `id`
- `provider` — `google` or `apple`
- `provider_account_id` — stable provider subject (`sub`)
- `user_id` — required edge to `User`
- optional encrypted OAuth access/refresh token fields
- optional token expiry and scope fields
- unique constraint on `(provider, provider_account_id)`

An account represents one login method. One user can have both Google and Apple accounts.

### Session

Create a database-backed `sessions` Ent schema:

- `id`
- `user_id`
- `token_hash` — unique, never store the raw cookie token
- `expires_at`
- `ip_address`
- `user_agent`
- `created_at`
- `last_seen_at`
- optional `revoked_at`

Use an opaque random session token in the cookie. Hash it before storing it in the database.

### Verification

Do not add a verification table yet. Add it only if passwordless email, email verification, or reset flows are requested.

## Implementation phases

### 1. Confirm the auth integration point

- Inspect the installed `go-pkgz/auth/v2` hooks and provider callback flow.
- Select the post-auth/claims update hook that receives the verified `token.User`.
- Ensure persistence runs once per successful OAuth callback.
- Avoid adding database logic inside generic middleware unless the callback hook cannot provide the verified identity.

### 2. Add Ent schemas

- Add `api/ent/schema/account.go`.
- Add `api/ent/schema/session.go`.
- Update `api/ent/schema/user.go` with provider-neutral fields and edges.
- Add the composite uniqueness constraint for provider accounts.
- Regenerate Ent code with the existing `make generate` command.

### 3. Migrate the database

- Generate and apply the Ent migration.
- Preserve existing users during the migration.
- Convert existing `google_id` values into `accounts` rows.
- Do not drop `google_id` until the conversion is verified.
- Add indexes for user email, provider account identity, session token hash, and session expiry.

### 4. Implement persistence service

Add one small auth persistence function, preferably in `api/internal/auth`:

```text
upsertOAuthUser(ctx, provider, token.User) → local User
```

Behavior:

1. Find an account by provider and provider subject.
2. If found, update the linked user’s name, email, and picture when provider data is present.
3. If not found, match an existing user by verified email only when the provider email is trusted and normalized.
4. Otherwise create a user and account in one database transaction.
5. Return the local user ID.

Never merge accounts solely by display name. Normalize emails consistently and handle Apple private relay addresses as normal unique emails.

### 5. Implement sessions

- Generate a cryptographically random raw session token.
- Store only its hash in `sessions`.
- Set an HttpOnly, Secure-in-production, SameSite cookie.
- Store the XSRF token separately as required by the existing browser flow.
- Add middleware that resolves the session cookie to a local user.
- Reject expired and revoked sessions.
- Revoke the session on `/auth/logout`.
- Delete or revoke expired sessions with a small cleanup path when needed; do not add a background worker yet.

### 6. Connect OAuth callbacks

- Keep Google and Apple provider verification in `go-pkgz/auth`.
- After verification, persist the provider identity and local user.
- Issue the application session only after the database transaction succeeds.
- Redirect to the requested frontend URL only after the session cookie is set.
- Reject missing provider IDs, missing required Apple configuration, and database failures.

### 7. Update API responses

- Make `/auth/user` return the local database user plus minimal provider-neutral fields.
- Make `/me` return the same local user representation.
- Keep provider account IDs and OAuth tokens out of normal frontend responses.
- Return `401` for missing, expired, revoked, or invalid sessions.

### 8. Update frontend session handling

- Keep `/sign-in` redirecting authenticated users to `/dashboard`.
- Keep the landing CTA changing from `GET STARTED` to `DASHBOARD` based on `/auth/user`.
- Remove any provider-specific user assumptions from the Zustand `User` type.
- Remove the old refresh-token request because database sessions are validated directly.
- Ensure every cookie-authenticated request includes `X-XSRF-TOKEN`.

### 9. Configuration and documentation

- Document session cookie name and lifetime.
- Keep Google variables unchanged.
- Keep Apple variables unchanged: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, and `APPLE_PRIVATE_KEY_PATH`.
- Document that `AUTH_URL` must match the OAuth callback host.
- Document migration and local setup in `README.md`.
- Ensure `.env`, `.p8`, and generated secrets remain ignored.

## Validation

### Automated

- `go test ./...`
- `npm run build`
- Ent migration applies to a clean database.
- Migration preserves and converts existing Google users.
- Persistence is idempotent when the same provider logs in repeatedly.
- Same email from two providers links according to the explicit trusted-email rule.
- Expired and revoked sessions return `401`.

### Manual

1. Sign in with Google from `/sign-in`.
2. Verify one `users` row, one `accounts` row, and one `sessions` row.
3. Refresh the browser and verify `/auth/user` still returns the local user.
4. Sign out and verify the session is revoked.
5. Sign in with Apple and verify a second provider account can link to the same user when appropriate.
6. Verify `/dashboard` is inaccessible without a valid session.

## Security requirements

- Use `crypto/rand` for session tokens.
- Hash session tokens at rest.
- Use parameterized Ent queries and transactions.
- Do not log OAuth tokens, Apple private keys, raw session tokens, or authorization codes.
- Validate OAuth issuer, audience, and provider subject through `go-pkgz/auth`.
- Restrict OAuth redirect destinations with an explicit production allowlist.
- Use Secure cookies and HTTPS in production.
- Do not silently merge accounts by unverified email.

## Deliberate non-goals

- Replacing `go-pkgz/auth` with the Better Auth TypeScript package.
- Adding password authentication.
- Adding Redis or a background session cleanup worker.
- Building an account settings UI.
- Persisting provider access tokens unless an API integration needs them.

