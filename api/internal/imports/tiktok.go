package imports

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

const apifyURL = "https://api.apify.com/v2/acts/scraptik~tiktok-api/runs"

type TikTokContentType string

const (
	TikTokPhoto TikTokContentType = "tiktok:photo"
	TikTokVideo TikTokContentType = "tiktok:video"
)

var awemeIDPattern = regexp.MustCompile(`(?:^|/)((?:\d){10,})(?:/|$)`)

type request struct {
	URL string `json:"url"`
}

type savedRun struct {
	RequestedURL  string            `json:"requested_url"`
	RedirectedURL string            `json:"redirected_url"`
	ContentType   TikTokContentType `json:"content_type"`
	AwemeID       string            `json:"aweme_id"`
	CreatedAt     time.Time         `json:"created_at"`
	ApifyResponse json.RawMessage   `json:"apify_response"`
}

func HandleImport(token, debugDir, authURL, webhookSecret string) http.HandlerFunc {
	client := &http.Client{Timeout: 30 * time.Second, CheckRedirect: func(_ *http.Request, via []*http.Request) error {
		if len(via) >= 10 {
			return http.ErrUseLastResponse
		}
		return nil
	}}
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", http.MethodPost)
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if token == "" {
			http.Error(w, "APIFY_API_TOKEN is not configured", http.StatusServiceUnavailable)
			return
		}
		if authURL == "" || webhookSecret == "" {
			http.Error(w, "AUTH_URL and IMPORT_WEBHOOK_SECRET are not configured", http.StatusServiceUnavailable)
			return
		}
		var input request
		if err := json.NewDecoder(io.LimitReader(r.Body, 4096)).Decode(&input); err != nil {
			http.Error(w, "body must be JSON with a url", http.StatusBadRequest)
			return
		}
		requested, err := validateTikTokURL(input.URL)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		redirected, err := resolve(r.Context(), client, requested)
		if err != nil {
			http.Error(w, "failed to resolve TikTok URL", http.StatusBadGateway)
			return
		}
		awemeID := extractAwemeID(redirected.Path)
		if awemeID == "" {
			http.Error(w, "TikTok URL does not contain an Aweme ID", http.StatusBadRequest)
			return
		}
		contentType, err := ParseTikTokContentType(redirected.String())
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		payload, _ := json.Marshal(tikTokActorInput(awemeID))
		webhook, err := url.Parse(strings.TrimRight(authURL, "/") + "/webhooks/import")
		if err != nil || webhook.Scheme == "" || webhook.Host == "" {
			http.Error(w, "AUTH_URL must be an absolute URL", http.StatusInternalServerError)
			return
		}
		query := webhook.Query()
		query.Set("secret", webhookSecret)
		webhook.RawQuery = query.Encode()
		webhookSpec, _ := json.Marshal([]map[string]any{{
			"eventTypes":      []string{"ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED"},
			"requestUrl":      webhook.String(),
			"payloadTemplate": fmt.Sprintf(`{"source":"tiktok","aweme_id":"%s","resource":{{resource}}}`, awemeID),
		}})
		encodedWebhooks := base64.StdEncoding.EncodeToString(webhookSpec)
		apiRequest, err := http.NewRequestWithContext(r.Context(), http.MethodPost, apifyURL+"?token="+url.QueryEscape(token)+"&webhooks="+url.QueryEscape(encodedWebhooks), bytes.NewReader(payload))
		if err != nil {
			http.Error(w, "failed to create Apify request", http.StatusInternalServerError)
			return
		}
		apiRequest.Header.Set("Content-Type", "application/json")
		apiResponse, err := client.Do(apiRequest)
		if err != nil {
			http.Error(w, "failed to launch Apify", http.StatusBadGateway)
			return
		}
		defer apiResponse.Body.Close()
		apifyBody, err := io.ReadAll(io.LimitReader(apiResponse.Body, 10<<20))
		if err != nil || !json.Valid(apifyBody) {
			http.Error(w, "Apify returned invalid JSON", http.StatusBadGateway)
			return
		}
		if apiResponse.StatusCode < 200 || apiResponse.StatusCode >= 300 {
			http.Error(w, "Apify rejected the run", http.StatusBadGateway)
			return
		}
		if err := os.MkdirAll(debugDir, 0o750); err != nil {
			http.Error(w, "failed to create Apify debug directory", http.StatusInternalServerError)
			return
		}
		output := savedRun{requested.String(), redirected.String(), contentType, awemeID, time.Now().UTC(), apifyBody}
		filename := filepath.Join(debugDir, fmt.Sprintf("%s_%s.json", awemeID, output.CreatedAt.Format("2006-01-02_15_04_05")))
		encoded, _ := json.MarshalIndent(output, "", "  ")
		if err := os.WriteFile(filename, encoded, 0o600); err != nil {
			http.Error(w, "failed to save Apify response", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]string{"aweme_id": awemeID, "content_type": string(contentType), "redirected_url": redirected.String(), "saved_file": filename})
	}
}

// ParseTikTokContentType classifies a normalized TikTok URL for downstream import handling.
func ParseTikTokContentType(raw string) (TikTokContentType, error) {
	u, err := validateTikTokURL(raw)
	if err != nil {
		return "", err
	}
	for _, segment := range strings.Split(strings.Trim(u.Path, "/"), "/") {
		switch strings.ToLower(segment) {
		case "photo":
			return TikTokPhoto, nil
		case "video":
			return TikTokVideo, nil
		}
	}
	return "", fmt.Errorf("TikTok URL must contain /photo/ or /video/")
}

func validateTikTokURL(raw string) (*url.URL, error) {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || u.Scheme != "https" || u.Host == "" || !isTikTokHost(u.Hostname()) {
		return nil, fmt.Errorf("url must be an HTTPS TikTok URL")
	}
	return u, nil
}

func resolve(ctx context.Context, client *http.Client, input *url.URL) (*url.URL, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, input.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, io.LimitReader(resp.Body, 1024))
	if resp.Request == nil || resp.Request.URL == nil || !isTikTokHost(resp.Request.URL.Hostname()) {
		return nil, fmt.Errorf("redirected outside TikTok")
	}
	return resp.Request.URL, nil
}

func isTikTokHost(host string) bool {
	host = strings.ToLower(strings.TrimSuffix(host, "."))
	return host == "tiktok.com" || strings.HasSuffix(host, ".tiktok.com")
}

func extractAwemeID(path string) string {
	match := awemeIDPattern.FindStringSubmatch(path)
	if len(match) == 2 {
		return match[1]
	}
	return ""
}

func tikTokActorInput(awemeID string) map[string]any {
	return map[string]any{
		"profile_username": "", "profile_userId": "", "profile_secUserId": "", "profile_region": "GB",
		"usernameToId_username": "", "followers_userId": "", "followers_secUserId": "", "followers_count": 10, "followers_maxTime": 0,
		"following_userId": "", "following_secUserId": "", "following_count": 10, "following_maxTime": 0, "post_awemeId": awemeID, "post_region": "GB",
		"userPosts_userId": "", "userPosts_secUserId": "", "userPosts_count": 10, "userPosts_region": "GB", "userPosts_maxCursor": "0",
		"music_id": "", "musicPosts_musicId": "", "musicPosts_count": 18, "musicPosts_cursor": 0, "challengePosts_cid": "", "challengePosts_count": 20,
		"challengePosts_cursor": 0, "commentReplies_commentId": "", "commentReplies_awemeId": "", "commentReplies_count": 10, "commentReplies_cursor": 0,
		"listComments_awemeId": "", "listComments_count": 10, "listComments_cursor": 0, "userLikes_userId": "", "userLikes_count": 10, "userLikes_maxCursor": "0",
		"searchUsers_keyword": "", "searchUsers_count": 20, "searchUsers_cursor": 0, "searchPosts_keyword": "", "searchPosts_count": 10, "searchPosts_offset": 0,
		"searchPosts_region": "GB", "searchPosts_publishTime": 0, "searchPosts_sortType": 0, "searchSounds_keyword": "", "searchSounds_count": 10, "searchSounds_cursor": 0,
		"searchSounds_region": "GB", "searchSounds_useFilters": false, "searchSounds_filterBy": 0, "searchSounds_sortType": 0, "searchHashtags_keyword": "", "searchHashtags_count": 20,
		"searchHashtags_region": "GB", "searchHashtags_cursor": 0, "searchLives_keyword": "", "searchLives_count": 20, "searchLives_offset": 0, "videoWithoutWatermark_awemeId": "",
	}
}
