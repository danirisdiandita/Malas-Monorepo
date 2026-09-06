# Set API token
API_TOKEN=<YOUR_API_TOKEN>

# Prepare Actor input
cat > input.json <<'EOF'
{
  "video_urls": [
    {
      "url": "https://www.tiktok.com/@therock/video/7473147398718573866"
    },
    {
      "url": "https://www.tiktok.com/@mrbeast/video/7476529277253635374"
    }
  ],
  "desired_resolution": "720p",
  "include_watermark": false,
  "saveToKeyValueStore": false
}
EOF

# Run the Actor
curl "https://api.apify.com/v2/actors/2MFh52P7QIPIIVplh/runs?token=$API_TOKEN" \
  -X POST \
  -d @input.json \
  -H 'Content-Type: application/json'
