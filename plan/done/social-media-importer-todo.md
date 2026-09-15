# Social media importer TODO

Implement and test each source one content type at a time.

## 1. Facebook

- [x] Facebook video
- [x] Facebook photos / album

## 2. TikTok

- [x] TikTok video
- [x] TikTok photos / carousel

## 3. Instagram

- [x] Instagram photos / carousel
- [x] Instagram Reels

## 4. YouTube

- [x] YouTube video
- [x] YouTube Shorts

## 5. Pinterest

- [x] Pinterest image Pin
- [x] Pinterest video Pin

## 6. Website

- [ ] Website article page
- [ ] Website recipe page
- [ ] Website images / gallery
- [ ] Website video

## Shared behavior for every source

- [ ] Detect the source and content type from the URL.
- [ ] Reject unsupported or private content with a clear error.
- [ ] Download media into a predictable output folder.
- [ ] Preserve the original filename when available.
- [ ] Avoid duplicate downloads.
- [ ] Save basic metadata beside downloaded media.
- [ ] Add one CLI check for each completed content type.
