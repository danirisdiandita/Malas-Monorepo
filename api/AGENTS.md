# API instructions

The API is a Go service using Chi, Ent, PostgreSQL, and explicit SQL migrations.

## Folder structure

Keep the composition root small:

```text
api/
├── cmd/
│   ├── api/                 # server startup and dependency wiring only
│   └── migrate/             # migration command only
├── internal/
│   ├── config/              # environment/config loading and validation
│   ├── db/                  # database client setup
│   ├── middleware/          # HTTP middleware
│   ├── auth/                # authentication persistence and auth rules
│   ├── handlers/            # HTTP transport: decode, call service, encode
│   └── <domain>/             # feature code as the API grows
│       ├── handler.go       # route-level HTTP handlers
│       ├── service.go       # business rules and orchestration
│       ├── repository.go    # Ent/database access when needed
│       └── model.go         # domain types when needed
├── ent/schema/              # source-of-truth Ent schemas
└── ent/                     # generated code; never edit by hand
```

Use domain packages such as `internal/recipes`, `internal/groceries`, and
`internal/imports` once each feature has real behavior. Keep small features in
the existing package until splitting them improves ownership or testability.

## Adding a new service or feature

1. Add the domain under `internal/<domain>`; do not add another generic
   `utils`, `helpers`, or `services` package.
2. Put HTTP parsing and response status decisions in the handler.
3. Put business rules in the service; keep it independent of `net/http`.
4. Put database queries in the repository only when they are reused or make
   the service easier to test. Direct Ent queries are fine for one simple use.
5. Wire dependencies in `cmd/api/main.go`; keep route registration and HTTP
   middleware in `internal/server/router.go`, with no business logic in either.
6. Add focused handler/service tests beside the code. Use an integration test
   only when behavior depends on PostgreSQL or Ent query semantics.
7. If the database changes, update `ent/schema`, run `moon run api:generate`,
   then add a new ordered migration in `ent/migrate/migrations/`. Never edit a
   migration that may already have run.
8. Run `gofmt`, `go test ./...`, and the relevant Moon task before handoff.

## API and production rules

- Validate required secrets and connection settings at startup; never use a
  production fallback secret.
- Keep authentication and authorization at the route boundary, and enforce
  authenticated `user_id` scoping in every user-owned query.
- Public webhooks must use a shared secret or signature, a body-size limit, and
  rate limiting before production exposure.
- Store durable user data in PostgreSQL/object storage, not local disk.
- Use context-aware database calls and graceful server shutdown.
- Add health/readiness checks, structured logs, metrics, and tracing when the
  service is deployed beyond local development.
- Keep generated code, credentials, `.env` files, debug payloads, and build
  output out of commits.

## Current debug webhook

`POST /webhooks/debug` saves valid JSON to `WEBHOOK_DEBUG_DIR` as a random UUID
filename. Set `WEBHOOK_DEBUG_SECRET` and send it as `X-Webhook-Secret`.
This endpoint is for debugging only and should move to durable storage or be
removed before production.

TikTok imports use `POST /imports/tiktok`; their completion callback uses the
source-agnostic `POST /webhooks/import`. Configure `APIFY_API_TOKEN`, public
`AUTH_URL`, and `IMPORT_WEBHOOK_SECRET`. The import webhook accepts any Apify dataset and
saves `webhook.json`, `dataset.json`, downloaded media under `assets/`, and
`assets.json` under `APIFY_DEBUG_DIR`.
