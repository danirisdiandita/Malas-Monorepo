# RevenueCat webhook parity

## Current API endpoint

The Go API receives RevenueCat events at:

```text
POST /webhooks/revenuecat
Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
```

The webhook is public and protected by the configured shared secret. The
request body is limited to 1 MB and must contain an `event.type`.

## Subscription persistence

The handler resolves `event.app_user_id` through
`revenue_cat_identities.rc_app_user_id`, then updates the existing user
subscription or creates one when needed.

Supported behavior:

- `INITIAL_PURCHASE` and `RENEWAL` set `start_date` from `purchased_at_ms`.
- `INITIAL_PURCHASE` and `RENEWAL` set `end_date` from `expiration_at_ms`.
- Missing purchase dates fall back to the current time.
- Missing expiration dates fall back to one month from the current time.
- `CANCELLATION` sets status to `CANCELED`.
- `EXPIRATION` sets status to `EXPIRED`.
- `BILLING_ISSUE` sets status to `BILLING_ISSUE`.
- `SUBSCRIPTION_PAUSED` sets status to `PAUSED`.
- `TRANSFER` expires the old subscription, preserves its metadata and dates,
  and creates or updates the new subscription as `RESTORED`.
- During a transfer, the RevenueCat customer API is queried when the old
  subscription has no expiration date. The active entitlement expiration is
  used when available.

Required server environment variables for the transfer lookup:

```text
REVENUECAT_WEBHOOK_SECRET
REVENUECAT_API_KEY
REVENUECAT_PROJECT_ID
```

## Important schema difference

The RevenueCat-related columns are compatible, but the two projects are not
identical database schemas:

- Lecture AI has a unique `user_id` and unique `rc_app_user_id`.
- Malas currently allows duplicate subscription and identity rows.
- Lecture AI includes `latest_payment_provider`; Malas does not.
- The identity table names differ between projects.

The Malas account-creation flow currently creates one subscription row with
`credit = 3`, so the webhook updates that row by `user_id`. Before adding
unique constraints, check for existing duplicates and clean them up in a
separate migration. Do not add a uniqueness migration blindly because it can
fail when duplicate data already exists.

## Verification

Compile the relevant packages with:

```bash
cd api
GOCACHE=/tmp/malas-go-cache go test -run '^$' ./internal/handlers ./internal/server ./internal/config
```
