# Repository instructions

Read the instructions for the project you are changing:

- [API](./api/AGENTS.md)
- [Dashboard](./dashboard/AGENTS.md)
- [Mobile](./mobile/AGENTS.md)

When a project instruction file is missing, continue with the repository rules
and the closest applicable project conventions.

## Eraser MCP

The shared Eraser workspace used for the data structure and Recipes UI canvas:

- MCP server: `https://app.eraser.io/api/mcp`
- Team ID: `nAfmNWNTUDT7dIbFE4vr`
- File/workspace ID: `7lSahianFerzWHrYMQOB`
- File URL: `https://app.eraser.io/workspace/7lSahianFerzWHrYMQOB`
- Data structure ERD ID: `LanZNDwaq2NYH43JrZNS`
- Recipes folder-flow wireframe ID: `7bssOIcT7lG-9QYV2LLK`

If the Eraser MCP session or connection is lost:

1. Run `codex mcp add eraser --url https://app.eraser.io/api/mcp`.
2. Complete the OAuth authorization flow.
3. Reuse the file and diagram IDs above when updating the existing canvas.
4. If the file no longer exists, create a new shared file and rebuild the ERD from `plan/idea/recipe-data-structure.md`; rebuild the Recipes folder flow from `mobile/src/app/(tabs)/recipes.tsx`.

Do not store OAuth tokens or credentials in this repository.

## Query and blocking rules

- Always avoid N+1 database and API query patterns. Prefer eager loading, joins,
  batching, or bulk operations; verify query behavior when adding related data.
- If blocked or unable to complete a requested change safely, say so clearly
  instead of guessing or silently shipping an incomplete workaround.

## Mobile pagination

- Mobile list endpoints must paginate with a maximum of 5 items per request and
  use infinite scroll to load the next page.

## Mobile async buttons

- Every mobile button that starts an async action must show an activity loader
  and be disabled until the action completes or fails.

## Social-media capability workflow

When adding or testing another social-media source, follow this order:

1. Create a representative dummy webhook and save the incoming payload as JSON
   under `api/debug/apify/<source>_<run-id>/`.
2. Verify the webhook is accepted, the dataset is saved, and every expected
   asset is downloaded under `assets/`. Fix payload parsing or asset extraction
   errors before continuing.
3. Add a root prototype script named `prototype-<source>-extraction.py`, based
   on the existing `prototype-recipe-extraction.py` and
   `prototype-recipe-video-extraction.py` patterns. Save the final prompt
   without attachments to `prompt.json` for debugging.
4. For non-video sources, use the GPT Luna extraction flow used for TikTok
   photos. For video sources, compress the video first, then use the Gemini
   video extraction flow. Keep structured JSON schema output compatible with
   the recipes data model.
5. Use `api/internal/imports/link.go` and the existing source-specific actor
   input builders as parser and endpoint examples. Add source detection and
   actor configuration through the existing centralized config instead of
   duplicating import flows.

Always test the debug webhook and prototype with a real saved fixture before
wiring the source into the mobile app or production import path.
