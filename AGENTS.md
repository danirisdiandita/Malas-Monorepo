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
