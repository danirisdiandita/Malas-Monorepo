package imports

import (
	"encoding/json"
	"testing"
)

func TestExtractAwemeID(t *testing.T) {
	got := extractAwemeID("/@cooking.tv19/photo/7655600141617089812")
	if got != "7655600141617089812" {
		t.Fatalf("got %q", got)
	}
}

func TestParseTikTokContentType(t *testing.T) {
	for _, test := range []struct {
		path string
		want TikTokContentType
	}{
		{"https://www.tiktok.com/@cook/photo/1234567890123", TikTokPhoto},
		{"https://www.tiktok.com/@cook/video/1234567890123", TikTokVideo},
	} {
		got, err := ParseTikTokContentType(test.path)
		if err != nil || got != test.want {
			t.Fatalf("ParseTikTokContentType(%q) = %q, %v", test.path, got, err)
		}
	}
}

func TestParseFacebookReelsContentType(t *testing.T) {
	got, err := ParseLinkContentType("https://www.facebook.com/reel/123456789")
	if err != nil || got != FacebookReels {
		t.Fatalf("ParseLinkContentType() = %q, %v", got, err)
	}
}

func TestParseFacebookPostContentType(t *testing.T) {
	got, err := ParseLinkContentType("https://www.facebook.com/humansofnewyork/")
	if err != nil || got != FacebookPost {
		t.Fatalf("ParseLinkContentType() = %q, %v", got, err)
	}
}

func TestFacebookActorInput(t *testing.T) {
	input := facebookActorInput("https://www.facebook.com/reel/123456789")
	urls, ok := input["individual_reel_url"].([]map[string]string)
	if !ok || len(urls) != 1 || urls[0]["url"] != "https://www.facebook.com/reel/123456789" || input["reels_count"] != 1 {
		t.Fatalf("unexpected Facebook actor input: %#v", input)
	}
}

func TestFacebookPostsActorInput(t *testing.T) {
	input := facebookPostsActorInput("https://www.facebook.com/humansofnewyork/")
	urls, ok := input["startUrls"].([]map[string]string)
	if !ok || len(urls) != 1 || urls[0]["url"] != "https://www.facebook.com/humansofnewyork/" {
		t.Fatalf("unexpected Facebook posts actor input: %#v", input)
	}
}

func TestInstagramPost(t *testing.T) {
	got, err := ParseLinkContentType("https://www.instagram.com/p/Dcth41Zgnz5/?img_index=8")
	if err != nil || got != InstagramPost {
		t.Fatalf("ParseLinkContentType() = %q, %v", got, err)
	}
	input := instagramActorInput("https://www.instagram.com/p/Dcth41Zgnz5/")
	if input["addParentData"] != false || input["resultsLimit"] != 1 || input["resultsType"] != "posts" {
		t.Fatalf("unexpected Instagram actor input: %#v", input)
	}
}

func TestInstagramReel(t *testing.T) {
	got, err := ParseLinkContentType("https://www.instagram.com/reel/DOlXDSKjDdv/")
	if err != nil || got != InstagramReel {
		t.Fatalf("ParseLinkContentType() = %q, %v", got, err)
	}
	input := instagramReelsActorInput("https://www.instagram.com/reel/DOlXDSKjDdv/")
	urls, ok := input["username"].([]string)
	if !ok || len(urls) != 1 || urls[0] == "" || input["includeDownloadedVideo"] != false || input["resultsLimit"] != 1 {
		t.Fatalf("unexpected Instagram Reels actor input: %#v", input)
	}
}

func TestPinterestPin(t *testing.T) {
	got, err := ParseLinkContentType("https://www.pinterest.com/pin/28006828930752858/")
	if err != nil || got != PinterestPin {
		t.Fatalf("ParseLinkContentType() = %q, %v", got, err)
	}
	input := pinterestActorInput("https://www.pinterest.com/pin/28006828930752858/")
	urls, ok := input["startUrls"].([]string)
	if !ok || len(urls) != 1 || urls[0] == "" || input["content_analysis"] != false || input["sentinent_analysis"] != false {
		t.Fatalf("unexpected Pinterest actor input: %#v", input)
	}
}

func TestCollectPinterestAssetURLsUsesCanonicalPinImage(t *testing.T) {
	storyImage := map[string]any{"images": map[string]any{
		"originals": map[string]any{"url": "https://i.pinimg.com/originals/story.jpg"},
	}}
	item := map[string]any{
		"media": map[string]any{"images": map[string]any{
			"thumb":    map[string]any{"url": "https://i.pinimg.com/236x/pin.jpg"},
			"original": map[string]any{"url": "https://i.pinimg.com/originals/pin.png"},
		}},
		"creator": map[string]any{"image_medium_url": "https://i.pinimg.com/75x/profile.jpg"},
		"pin":     map[string]any{"story": map[string]any{"pages": []any{map[string]any{"image": storyImage}}}},
	}
	assets := collectPinterestAssetURLs([]any{item})
	if len(assets) != 1 || assets[0].URL != "https://i.pinimg.com/originals/pin.png" {
		t.Fatalf("unexpected Pinterest assets: %#v", assets)
	}
}

func TestCollectPinterestAssetURLsPrefersVideo(t *testing.T) {
	assets := collectPinterestAssetURLs([]any{map[string]any{
		"media": map[string]any{
			"images": map[string]any{"original": map[string]any{"url": "https://i.pinimg.com/originals/cover.jpg"}},
			"video":  map[string]any{"hls_url": "https://v1.pinimg.com/video.m3u8"},
		},
	}})
	if len(assets) != 1 || assets[0].URL != "https://v1.pinimg.com/video.m3u8" || !isVideoAsset(assets[0].URL) {
		t.Fatalf("unexpected Pinterest video assets: %#v", assets)
	}
}

func TestParseYouTubeContentType(t *testing.T) {
	short, err := ParseLinkContentType("https://www.youtube.com/shorts/abc123")
	if err != nil || short != YouTubeShort {
		t.Fatalf("short content type = %q, %v", short, err)
	}
	for _, raw := range []string{
		"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		"https://youtu.be/dQw4w9WgXcQ",
	} {
		got, err := ParseLinkContentType(raw)
		if err != nil || got != YouTubeVideo {
			t.Fatalf("ParseLinkContentType(%q) = %q, %v", raw, got, err)
		}
	}
}

func TestYouTubeTranscriptActorInput(t *testing.T) {
	input := youtubeTranscriptActorInput("https://www.youtube.com/shorts/abc123")
	if input["youtube_url"] != "https://www.youtube.com/shorts/abc123" || input["include_metadata"] != true || input["channel_transcripts"] != false {
		t.Fatalf("unexpected YouTube transcript actor input: %#v", input)
	}
}

func TestYouTubeShortFinalJSON(t *testing.T) {
	items := []any{map[string]any{
		"video_id":        "abc123",
		"title":           "Chicken Parm",
		"description":     "Chicken recipe",
		"non_timestamped": "Mix and cook",
		"thumbnail_url":   "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
	}}
	final := buildFinalJSON(items, string(YouTubeShort), nil)
	if final["title"] != "Chicken Parm" || final["description"] != "Chicken recipe" || final["subtitles"] != "Mix and cook" || final["thumbnail_url"] == "" {
		t.Fatalf("unexpected YouTube Shorts final JSON: %#v", final)
	}
}

func TestYouTubeActorInput(t *testing.T) {
	input := youtubeActorInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
	urls, ok := input["startUrls"].([]map[string]string)
	if !ok || len(urls) != 1 || urls[0]["url"] != "https://www.youtube.com/watch?v=dQw4w9WgXcQ" || input["maxResults"] != 1 || input["subtitlesFormat"] != "plaintext" || input["subtitlesLanguage"] != "any" || input["transcriptionAndSubtitle"] != "ALWAYS_SUBTITLES" {
		t.Fatalf("unexpected YouTube actor input: %#v", input)
	}
}

func TestCollectAssetURLs(t *testing.T) {
	assets := collectAssetURLs(map[string]any{
		"cover":  "https://p16.tiktokcdn.com/cover.webp",
		"share":  "https://www.tiktok.com/@cook/video/1234567890123",
		"images": []any{"https://p16.tiktokcdn.com/photo.jpeg", "https://p16.tiktokcdn.com/cover.webp"},
	})
	if len(assets) != 2 {
		t.Fatalf("expected 2 unique CDN assets, got %d", len(assets))
	}
}

func TestCollectImagePostAssetURLsUsesImagesOnly(t *testing.T) {
	assets := collectImagePostAssetURLs(map[string]any{
		"image_post_info": map[string]any{
			"image_post_cover": map[string]any{"thumbnail": map[string]any{"url_list": []any{"https://cdn.example/cover.webp"}}},
			"images": []any{
				map[string]any{"thumbnail": map[string]any{"url_list": []any{"https://cdn.example/image-1.webp"}}},
				map[string]any{"thumbnail": map[string]any{"url_list": []any{"https://cdn.example/image-2.webp"}}},
			},
		},
	})
	if len(assets) != 2 || assets[0].URL != "https://cdn.example/image-1.webp" || assets[1].URL != "https://cdn.example/image-2.webp" {
		t.Fatalf("unexpected image_post_info assets: %#v", assets)
	}
}

func TestCollectVideoAssetURLsPrefersNoWatermark(t *testing.T) {
	assets := collectVideoAssetURLs(map[string]any{
		"video": map[string]any{
			"play_addr":                  map[string]any{"url_list": []any{"https://cdn.example/watermarked.mp4"}},
			"download_no_watermark_addr": map[string]any{"url_list": []any{"https://cdn.example/video.mp4"}},
		},
	})
	if len(assets) != 1 || assets[0].URL != "https://cdn.example/video.mp4" {
		t.Fatalf("unexpected video asset: %#v", assets)
	}
}

func TestCollectVideoAssetURLsSupportsFacebookReel(t *testing.T) {
	assets := collectVideoAssetURLs([]any{map[string]any{
		"thumbnail_url": "https://scontent.fbcdn.net/thumb.jpg",
		"video_url_hd":  "https://video.fbcdn.net/reel.mp4",
		"video_url_sd":  "https://video.fbcdn.net/reel-sd.mp4",
	}})
	if len(assets) != 1 || assets[0].URL != "https://video.fbcdn.net/reel.mp4" {
		t.Fatalf("unexpected Facebook video assets: %#v", assets)
	}
}

func TestCollectAssetURLsSupportsFacebookPostMedia(t *testing.T) {
	assets := collectFacebookPostAssetURLs([]any{map[string]any{
		"user": map[string]any{"profilePic": "https://scontent.fbcdn.net/profile.jpg"},
		"media": []any{map[string]any{
			"thumbnail":   "https://scontent.fbcdn.net/post.jpg",
			"photo_image": map[string]any{"uri": "https://scontent.fbcdn.net/post-full.jpg"},
		}},
	}})
	if len(assets) != 2 || assets[0].URL != "https://scontent.fbcdn.net/post.jpg" {
		t.Fatalf("expected 2 Facebook post assets, got %#v", assets)
	}
}

func TestTikTokActorInput(t *testing.T) {
	input := tikTokActorInput("7673459097236262165")
	if input["post_awemeId"] != "7673459097236262165" || input["aweme_id"] != nil || input["profile_region"] != "GB" {
		t.Fatalf("unexpected actor input: %#v", input)
	}
}

func TestApifyRunBuildID(t *testing.T) {
	var run apifyRun
	if err := json.Unmarshal([]byte(`{"data":{"id":"run-123","buildId":"build-123"}}`), &run); err != nil || run.Data.ID != "run-123" || run.Data.BuildID != "build-123" {
		t.Fatalf("unexpected nested build ID: %#v", run)
	}
}
