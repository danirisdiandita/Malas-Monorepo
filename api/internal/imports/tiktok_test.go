package imports

import "testing"

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

func TestTikTokActorInput(t *testing.T) {
	input := tikTokActorInput("7673459097236262165")
	if input["aweme_id"] != "7673459097236262165" || input["post_awemeId"] != "" || input["profile_region"] != "GB" {
		t.Fatalf("unexpected actor input: %#v", input)
	}
}
