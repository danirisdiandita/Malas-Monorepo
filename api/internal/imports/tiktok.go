package imports

import (
	"bytes"
	"context"
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

var awemeIDPattern = regexp.MustCompile(`(?:^|/)((?:\d){10,})(?:/|$)`)

type request struct {
	URL string `json:"url"`
}

type savedRun struct {
	RequestedURL  string          `json:"requested_url"`
	RedirectedURL string          `json:"redirected_url"`
	AwemeID       string          `json:"aweme_id"`
	CreatedAt     time.Time       `json:"created_at"`
	ApifyResponse json.RawMessage `json:"apify_response"`
}

func Handle(token, debugDir string) http.HandlerFunc {
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
		payload, _ := json.Marshal(map[string]string{"aweme_id": awemeID})
		apiRequest, err := http.NewRequestWithContext(r.Context(), http.MethodPost, apifyURL+"?token="+url.QueryEscape(token), bytes.NewReader(payload))
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
		output := savedRun{requested.String(), redirected.String(), awemeID, time.Now().UTC(), apifyBody}
		filename := filepath.Join(debugDir, fmt.Sprintf("%s_%s.json", awemeID, output.CreatedAt.Format("2006-01-02_15_04_05")))
		encoded, _ := json.MarshalIndent(output, "", "  ")
		if err := os.WriteFile(filename, encoded, 0o600); err != nil {
			http.Error(w, "failed to save Apify response", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]string{"aweme_id": awemeID, "redirected_url": redirected.String(), "saved_file": filename})
	}
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
