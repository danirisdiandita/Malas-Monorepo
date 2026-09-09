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
		Filename string `json:"filename"`
	}
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		t.Fatal(err)
	}
	if response.Filename == "" {
		t.Fatal("missing payload filename")
	}
	if _, err := os.Stat(filepath.Join(directory, response.Filename)); err != nil {
		t.Fatalf("saved payload missing: %v", err)
	}
	saved, err := os.ReadFile(filepath.Join(directory, response.Filename))
	if err != nil {
		t.Fatal(err)
	}
	var payload struct {
		Event string `json:"event"`
	}
	if err := json.Unmarshal(saved, &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Event != "done" {
		t.Fatalf("unexpected saved payload: %+v", payload)
	}
}

func TestDebugWebhookRequiresSecret(t *testing.T) {
	res := httptest.NewRecorder()
	HandleDebugWebhook(t.TempDir(), "secret").ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/webhooks/debug", nil))
	if res.Code != http.StatusUnauthorized {
		t.Fatalf("unexpected status: %d", res.Code)
	}
}
