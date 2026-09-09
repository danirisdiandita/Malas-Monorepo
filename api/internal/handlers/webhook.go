package handlers

import (
	"bytes"
	"crypto/subtle"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const maxDebugWebhookBody = 10 << 20

func HandleDebugWebhook(directory, secret string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", http.MethodPost)
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if secret == "" || subtle.ConstantTimeCompare([]byte(r.Header.Get("X-Webhook-Secret")), []byte(secret)) != 1 {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		body, err := io.ReadAll(io.LimitReader(r.Body, maxDebugWebhookBody+1))
		if err != nil {
			http.Error(w, "failed to read payload", http.StatusBadRequest)
			return
		}
		if len(body) > maxDebugWebhookBody || !json.Valid(bytes.TrimSpace(body)) {
			http.Error(w, "payload must be valid JSON and smaller than 10 MB", http.StatusBadRequest)
			return
		}

		if err := os.MkdirAll(directory, 0o750); err != nil {
			http.Error(w, "failed to create debug directory", http.StatusInternalServerError)
			return
		}

		filename := time.Now().UTC().Format("2006-01-02_15_04_05.000000000") + ".json"
		path := filepath.Join(directory, filename)
		if err := os.WriteFile(path, body, 0o600); err != nil {
			http.Error(w, "failed to save payload", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]string{"filename": filename})
	}
}
