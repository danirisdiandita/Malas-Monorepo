package handlers

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

const maxDebugWebhookBody = 10 << 20

func HandleDebugWebhook(directory string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// ponytail: intentionally unauthenticated for webhook debugging; add a shared secret and rate limit before production exposure.
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", http.MethodPost)
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
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

		id, err := randomUUID()
		if err != nil {
			http.Error(w, "failed to create payload id", http.StatusInternalServerError)
			return
		}
		path := filepath.Join(directory, id+".json")
		if err := os.WriteFile(path, body, 0o600); err != nil {
			http.Error(w, "failed to save payload", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]string{"id": id})
	}
}

func randomUUID() (string, error) {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16]), nil
}
