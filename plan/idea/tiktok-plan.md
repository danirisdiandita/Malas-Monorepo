Step 1: 
- mobile: right now add bottom sheet can be inserted with tiktok url (Paste the recipe link)

Step 2: 
- backend ./api: process that tiktok url with steps: 
- 1. make url redirection occurs so that it is normalised into seen on "redirected_url" in ./plan/prototype/links.json, 
- 2. launch apify
curl "https://api.apify.com/v2/acts/scraptik~tiktok-api/runs?token=$API_TOKEN" \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"aweme_id": "<aweme id is this id 7655600141617089812 in https://www.tiktok.com/@cooking.tv19/photo/7655600141617089812?q=recipes&t=1788781324625>"}'

save the output to json first (wanna see the result with <aweme_id>_YYYY-mm-DD_HH_MM_SS.json with good directory path)
