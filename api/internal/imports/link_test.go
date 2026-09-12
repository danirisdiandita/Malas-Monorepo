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

func TestFacebookActorInput(t *testing.T) {
	input := facebookActorInput("https://www.facebook.com/reel/123456789")
	if len(input["startUrls"].([]string)) != 1 || input["resultsLimit"] != 1 {
		t.Fatalf("unexpected Facebook actor input: %#v", input)
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
