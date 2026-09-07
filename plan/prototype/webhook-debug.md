# Debug webhook

Send a JSON payload to the API webhook:

```bash
curl -X POST http://localhost:8080/webhooks/debug \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "recipe.imported",
    "source": "tiktok",
    "url": "https://www.tiktok.com/@example/video/123456789",
    "recipe": {
      "name": "Creamy lemon pasta",
      "servings": 2
    }
  }'
```

The API returns the generated payload ID:

```json
{"id":"550e8400-e29b-41d4-a716-446655440000"}
```

The raw payload is saved as:

```text
./debug/webhooks/550e8400-e29b-41d4-a716-446655440000.json
```

Set `WEBHOOK_DEBUG_DIR` to change the output directory.
