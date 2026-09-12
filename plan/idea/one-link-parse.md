1. try if the link if tiktok:photos and click process, populate temporary recipes table with the most important one is the id (i forgot which id)
2. After click process in mobile app - redirect to loading screen, the loading screen look like this ./plan/idea/loading.html
3. During the loading screen, use refetching every 5 second until the webhook is received, when the tiktok link added is immediate checklisted, - "Looking at your Tiktok" shows loading - the blipping animation is optional when loading, - "Making your recipe" is when webhook is received and "raw_source_payload" column is already populated, then api call to llm is used (see this as prototype prototype-recipe-extraction.py)
4. use the first image photo to be uploaded to s3
5. once done within loading screen at the bottom add a primary button that if clicked redirect to the recipe screen of that recipe
