package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDebugWebhookSavesPayload(t *testing.T) {
	directory := t.TempDir()
	handler := HandleDebugWebhook(directory, "secret")
	req := httptest.NewRequest(http.MethodPost, "/webhooks/debug", strings.NewReader(`{"event":"done"}`))
	req.Header.Set("X-Webhook-Secret", "secret")
	res := httptest.NewRecorder()

	handler.ServeHTTP(res, req)
	if res.Code != http.StatusCreated {
		t.Fatalf("unexpected status: %d", res.Code)
	}

	var response struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		t.Fatal(err)
	}
	if response.ID == "" {
		t.Fatal("missing payload id")
	}
	if _, err := os.Stat(filepath.Join(directory, response.ID+".json")); err != nil {
		t.Fatalf("saved payload missing: %v", err)
	}
}

func TestDebugWebhookRequiresSecret(t *testing.T) {
	res := httptest.NewRecorder()
	HandleDebugWebhook(t.TempDir(), "secret").ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/webhooks/debug", nil))
	if res.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: %d", res.Code)
	}
}
