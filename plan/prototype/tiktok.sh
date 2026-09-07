#!/bin/bash
set -a
source plan/prototype/.env
set +a

# # Set API token
# APIFY_API_TOKEN=<YOUR_API_TOKEN>

# Prepare Actor input
cat > input.json <<'EOF'
{
  "video_urls": [
    {
      "url": "https://www.tiktok.com/@elysia.studytalk/photo/7643480136053968150"
    },
    {
      "url": "https://www.tiktok.com/@mrbeast/video/7476529277253635374"
    }
  ],
  "desired_resolution": "720p",
  "include_watermark": true,
  "saveToKeyValueStore": true
}
EOF

# Run the Actor
curl "https://api.apify.com/v2/actors/2MFh52P7QIPIIVplh/runs?token=$APIFY_API_TOKEN" \
  -X POST \
  -d @input.json \
  -H 'Content-Type: application/json'
