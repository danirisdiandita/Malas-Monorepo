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

type LinkContentType string
type TikTokContentType = LinkContentType

const (
	TikTokPhoto   LinkContentType = "tiktok:photo"
	TikTokVideo   LinkContentType = "tiktok:video"
	FacebookReels LinkContentType = "facebook:reels"
)

var awemeIDPattern = regexp.MustCompile(`(?:^|/)((?:\d){10,})(?:/|$)`)

type request struct {
	URL string `json:"url"`
}

type savedRun struct {
	RequestedURL  string          `json:"requested_url"`
	RedirectedURL string          `json:"redirected_url"`
	ContentType   LinkContentType `json:"content_type"`
	AwemeID       string          `json:"aweme_id"`
	CreatedAt     time.Time       `json:"created_at"`
	ApifyRequest  json.RawMessage `json:"apify_request"`
	ApifyResponse json.RawMessage `json:"apify_response"`
}

type apifyRun struct {
	ID      string `json:"id"`
	BuildID string `json:"buildId"`
	Data    struct {
		ID      string `json:"id"`
		BuildID string `json:"buildId"`
	} `json:"data"`
}

func HandleImport(token, debugDir, authURL, webhookSecret, tikTokActorURL, facebookReelsActorURL string) http.HandlerFunc {
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
		requested, err := validateLinkURL(input.URL)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		redirected, err := resolve(r.Context(), client, requested)
		if err != nil {
			http.Error(w, "failed to resolve TikTok URL", http.StatusBadGateway)
			return
		}
		contentType, err := ParseLinkContentType(redirected.String())
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		awemeID := extractAwemeID(redirected.Path)
		if contentType != FacebookReels && awemeID == "" {
			http.Error(w, "TikTok URL does not contain an Aweme ID", http.StatusBadRequest)
			return
		}
		source, actorURL := "tiktok", tikTokActorURL
		var actorInput any = tikTokActorInput(awemeID)
		if contentType == FacebookReels {
			source, actorURL = "facebook", facebookReelsActorURL
			actorInput = facebookActorInput(redirected.String())
		}
		payload, _ := json.Marshal(actorInput)
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
			"payloadTemplate": fmt.Sprintf(`{"source":"%s","aweme_id":"%s","content_type":"%s","resource":{{resource}}}`, source, awemeID, contentType),
		}})
		encodedWebhooks := base64.StdEncoding.EncodeToString(webhookSpec)
		apiRequest, err := http.NewRequestWithContext(r.Context(), http.MethodPost, actorURL+"?token="+url.QueryEscape(token)+"&webhooks="+url.QueryEscape(encodedWebhooks), bytes.NewReader(payload))
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
		var run apifyRun
		_ = json.Unmarshal(apifyBody, &run)
		if run.ID == "" {
			run.ID = run.Data.ID
		}
		if run.ID == "" {
			run.ID = "unknown-run"
		}
		if run.BuildID == "" {
			run.BuildID = run.Data.BuildID
		}
		if run.BuildID == "" {
			run.BuildID = "unknown-build"
		}
		folder := filepath.Join(debugDir, source+"_"+safeName(run.ID))
		if err := os.MkdirAll(filepath.Join(folder, "assets"), 0o750); err != nil {
			http.Error(w, "failed to create Apify debug directory", http.StatusInternalServerError)
			return
		}
		output := savedRun{requested.String(), redirected.String(), contentType, awemeID, time.Now().UTC(), payload, apifyBody}
		prettyPayload, _ := json.MarshalIndent(actorInput, "", "  ")
		if err := os.WriteFile(filepath.Join(folder, "post_payload.json"), prettyPayload, 0o600); err != nil {
			http.Error(w, "failed to save Apify payload", http.StatusInternalServerError)
			return
		}
		encoded, _ := json.MarshalIndent(output, "", "  ")
		filename := filepath.Join(folder, "run.json")
		if err := os.WriteFile(filename, encoded, 0o600); err != nil {
			http.Error(w, "failed to save Apify response", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]string{"source": source, "aweme_id": awemeID, "content_type": string(contentType), "redirected_url": redirected.String(), "run_id": run.ID, "build_id": run.BuildID, "saved_file": filename})
	}
}

// ParseTikTokContentType classifies a normalized TikTok URL for downstream import handling.
func ParseTikTokContentType(raw string) (TikTokContentType, error) {
	return ParseLinkContentType(raw)
}

func ParseLinkContentType(raw string) (LinkContentType, error) {
	u, err := validateLinkURL(raw)
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
	if isFacebookHost(u.Hostname()) {
		for _, segment := range strings.Split(strings.Trim(u.Path, "/"), "/") {
			if strings.EqualFold(segment, "reel") || strings.EqualFold(segment, "reels") {
				return FacebookReels, nil
			}
		}
	}
	return "", fmt.Errorf("URL must be a TikTok photo/video or Facebook Reel")
}

func validateLinkURL(raw string) (*url.URL, error) {
	u, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || u.Scheme != "https" || u.Host == "" || (!isTikTokHost(u.Hostname()) && !isFacebookHost(u.Hostname())) {
		return nil, fmt.Errorf("url must be an HTTPS TikTok or Facebook URL")
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
	if resp.Request == nil || resp.Request.URL == nil || (!isTikTokHost(resp.Request.URL.Hostname()) && !isFacebookHost(resp.Request.URL.Hostname())) {
		return nil, fmt.Errorf("redirected outside TikTok or Facebook")
	}
	return resp.Request.URL, nil
}

func isTikTokHost(host string) bool {
	host = strings.ToLower(strings.TrimSuffix(host, "."))
	return host == "tiktok.com" || strings.HasSuffix(host, ".tiktok.com")
}

func isFacebookHost(host string) bool {
	host = strings.ToLower(strings.TrimSuffix(host, "."))
	return host == "facebook.com" || strings.HasSuffix(host, ".facebook.com")
}

func facebookActorInput(url string) map[string]any {
	return map[string]any{"startUrls": []string{url}, "resultsLimit": 1}
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
