package handlers

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAppleCallbackRedirect(t *testing.T) {
	for _, tc := range []struct {
		name, method, path string
		status, want       int
	}{
		{"apple POST", "POST", "/auth/apple/callback", 307, 303},
		{"apple error", "POST", "/auth/apple/callback", 500, 500},
		{"apple GET", "GET", "/auth/apple/callback", 307, 307},
		{"google callback", "GET", "/auth/google/callback", 307, 307},
		{"apple login", "GET", "/auth/apple/login", 302, 302},
	} {
		t.Run(tc.name, func(t *testing.T) {
			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				http.SetCookie(w, &http.Cookie{Name: "JWT", Value: "test-session", HttpOnly: true})
				http.Redirect(w, r, "http://localhost:5173/dashboard", tc.status)
			})
			w := httptest.NewRecorder()
			HandleAuthUser(nil, nil, next).ServeHTTP(w, httptest.NewRequest(tc.method, tc.path, nil))
			if w.Code != tc.want || w.Header().Get("Location") != "http://localhost:5173/dashboard" {
				t.Fatalf("unexpected redirect: %d %v", w.Code, w.Header())
			}
			cookies := w.Result().Cookies()
			if len(cookies) != 1 || cookies[0].Value != "test-session" || !cookies[0].HttpOnly {
				t.Fatalf("session cookie changed: %v", cookies)
			}
		})
	}

	// Follow the redirect as a browser would; the frontend must receive GET without Apple's form body.
	server := httptest.NewServer(HandleAuthUser(nil, nil, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/auth/apple/callback" {
			http.Redirect(w, r, "/dashboard", http.StatusTemporaryRedirect)
			return
		}
		body, _ := io.ReadAll(r.Body)
		if r.Method != http.MethodGet || len(body) != 0 {
			http.Error(w, "frontend received POST body", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusOK)
	})))
	defer server.Close()
	resp, err := server.Client().Post(server.URL+"/auth/apple/callback", "application/x-www-form-urlencoded", strings.NewReader("code=test-code&state=test-state"))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK || resp.Request.URL.Path != "/dashboard" {
		t.Fatalf("redirect failed: %d %s", resp.StatusCode, resp.Request.URL)
	}
}

func TestOAuthCallbackWriterPassesTokenToMobile(t *testing.T) {
	w := httptest.NewRecorder()
	w.Header().Set("Set-Cookie", "JWT=signed-token; Path=/; HttpOnly")
	w.Header().Set("Location", "mobile://auth/callback")

	oauthCallbackWriter{ResponseWriter: w}.WriteHeader(http.StatusFound)

	if got := w.Header().Get("Location"); got != "mobile://auth/callback?token=signed-token" {
		t.Fatalf("unexpected mobile redirect: %s", got)
	}
	if w.Code != http.StatusFound {
		t.Fatalf("unexpected status: %d", w.Code)
	}
}
