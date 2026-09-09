package imports

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	maxAssetCount = 100
	maxAssetBytes = 200 << 20
)

type apifyWebhook struct {
	Source   string `json:"source"`
	AwemeID  string `json:"aweme_id"`
	Event    string `json:"eventType"`
	Resource struct {
		Status            string `json:"status"`
		DefaultDatasetID  string `json:"defaultDatasetId"`
		DefaultKeyValueID string `json:"defaultKeyValueStoreId"`
	} `json:"resource"`
}

type asset struct {
	URL   string `json:"url"`
	File  string `json:"file,omitempty"`
	Error string `json:"error,omitempty"`
}

// HandleImportWebhook stores any completed Apify dataset and its media assets.
func HandleImportWebhook(token, debugDir, secret string) http.HandlerFunc {
	client := &http.Client{Timeout: 45 * time.Second}
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", http.MethodPost)
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		providedSecret := r.Header.Get("X-Webhook-Secret")
		if providedSecret == "" {
			providedSecret = r.URL.Query().Get("secret")
		}
		if secret == "" || subtle.ConstantTimeCompare([]byte(providedSecret), []byte(secret)) != 1 {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
		if err != nil || !json.Valid(body) {
			http.Error(w, "invalid webhook JSON", http.StatusBadRequest)
			return
		}
		var webhook apifyWebhook
		if err := json.Unmarshal(body, &webhook); err != nil || webhook.Resource.DefaultDatasetID == "" {
			http.Error(w, "webhook is missing resource.defaultDatasetId", http.StatusBadRequest)
			return
		}
		if webhook.Event == "ACTOR.RUN.FAILED" || webhook.Resource.Status == "FAILED" {
			http.Error(w, "Apify run failed", http.StatusBadGateway)
			return
		}
		datasetURL := "https://api.apify.com/v2/datasets/" + url.PathEscape(webhook.Resource.DefaultDatasetID) + "/items?clean=true"
		datasetResponse, err := getJSON(r.Context(), client, datasetURL, token)
		if err != nil {
			http.Error(w, "failed to fetch Apify dataset", http.StatusBadGateway)
			return
		}
		var items []any
		if err := json.Unmarshal(datasetResponse, &items); err != nil {
			http.Error(w, "Apify dataset must be a JSON array", http.StatusBadGateway)
			return
		}
		if webhook.AwemeID == "" {
			webhook.AwemeID = findAwemeID(items)
		}
		if webhook.Source == "" {
			webhook.Source = "unknown"
		}
		identifier := webhook.AwemeID
		if identifier == "" {
			identifier = webhook.Resource.DefaultDatasetID
		}
		folder := filepath.Join(debugDir, safeName(webhook.Source)+"_"+safeName(identifier)+"_"+time.Now().UTC().Format("2006-01-02_15_04_05.000000000"))
		if err := os.MkdirAll(filepath.Join(folder, "assets"), 0o750); err != nil {
			http.Error(w, "failed to create import output directory", http.StatusInternalServerError)
			return
		}
		prettyDataset, _ := json.MarshalIndent(items, "", "  ")
		if err := os.WriteFile(filepath.Join(folder, "dataset.json"), prettyDataset, 0o600); err != nil {
			http.Error(w, "failed to save dataset", http.StatusInternalServerError)
			return
		}
		if err := os.WriteFile(filepath.Join(folder, "webhook.json"), body, 0o600); err != nil {
			http.Error(w, "failed to save webhook", http.StatusInternalServerError)
			return
		}
		assets := collectAssetURLs(items)
		for index := range assets {
			assets[index].File, assets[index].Error = downloadAsset(r.Context(), client, assets[index].URL, filepath.Join(folder, "assets"), index)
		}
		manifest, _ := json.MarshalIndent(assets, "", "  ")
		if err := os.WriteFile(filepath.Join(folder, "assets.json"), manifest, 0o600); err != nil {
			http.Error(w, "failed to save asset manifest", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"directory": folder, "dataset_file": filepath.Join(folder, "dataset.json"), "asset_count": len(assets)})
	}
}

func safeName(value string) string {
	value = strings.TrimSpace(value)
	var b strings.Builder
	for _, r := range value {
		if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '-' || r == '_' || r == ':' {
			b.WriteRune(r)
		}
	}
	if b.Len() == 0 {
		return "unknown"
	}
	return b.String()
}

func getJSON(ctx context.Context, client *http.Client, endpoint, token string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	response, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("status %s", response.Status)
	}
	return io.ReadAll(io.LimitReader(response.Body, 200<<20))
}

func findAwemeID(value any) string {
	var found string
	walkJSON(value, func(key, value string) {
		if found == "" && key == "aweme_id" {
			found = value
		}
	})
	return found
}

func collectAssetURLs(value any) []asset {
	seen := map[string]bool{}
	assets := make([]asset, 0)
	walkJSON(value, func(path, value string) {
		if len(assets) < maxAssetCount && !seen[value] && isAssetURL(path, value) {
			seen[value] = true
			assets = append(assets, asset{URL: value})
		}
	})
	return assets
}

func walkJSON(value any, visit func(string, string)) {
	var walk func(any, string)
	walk = func(current any, key string) {
		switch typed := current.(type) {
		case map[string]any:
			for childKey, child := range typed {
				walk(child, childKey)
			}
		case []any:
			for _, child := range typed {
				walk(child, key)
			}
		case string:
			visit(key, typed)
		}
	}
	walk(value, "")
}

func isAssetURL(path, raw string) bool {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" {
		return false
	}
	host := strings.ToLower(u.Hostname())
	path = strings.ToLower(path)
	for _, token := range []string{"image", "photo", "video", "audio", "cover", "thumbnail", "media", "asset", "play_addr", "download_addr", "url_list"} {
		if strings.Contains(path, token) {
			return true
		}
	}
	return strings.Contains(host, "cdn") || strings.Contains(host, "cloudfront.net") || strings.Contains(host, "cloudinary.com") || strings.Contains(host, "imgur.com") || strings.Contains(host, "fbcdn.net") || strings.Contains(host, "ytimg.com") || strings.Contains(host, "googlevideo.com") || strings.Contains(host, "pinimg.com") || strings.Contains(host, "tiktokcdn.com") || strings.Contains(host, "ibytedtos.com") || strings.Contains(host, "muscdn.com")
}

func downloadAsset(ctx context.Context, client *http.Client, rawURL, directory string, index int) (string, string) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return "", err.Error()
	}
	response, err := client.Do(req)
	if err != nil {
		return "", err.Error()
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return "", response.Status
	}
	if response.ContentLength > maxAssetBytes {
		return "", "asset exceeds 200 MB"
	}
	ext := filepath.Ext(req.URL.Path)
	if len(ext) > 6 {
		ext = ""
	}
	if ext == "" {
		ext = ".bin"
	}
	filename := fmt.Sprintf("%03d%s", index+1, ext)
	data, err := io.ReadAll(io.LimitReader(response.Body, maxAssetBytes+1))
	if err != nil {
		return "", err.Error()
	}
	if len(data) > maxAssetBytes {
		return "", "asset exceeds 200 MB"
	}
	if err := os.WriteFile(filepath.Join(directory, filename), data, 0o600); err != nil {
		return "", err.Error()
	}
	return filepath.Join("assets", filename), ""
}
