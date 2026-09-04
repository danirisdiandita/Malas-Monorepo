package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	appauth "github.com/danirisdiandita/malas-monorepo/api/internal/auth"
	"github.com/go-pkgz/auth/v2/token"
)

func HandleMe(client *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		providerUser, err := token.GetUserInfo(r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		user, err := appauth.PersistUser(r.Context(), client, providerUser)
		if err != nil {
			http.Error(w, "failed to persist user", http.StatusInternalServerError)
			return
		}
		if err := appauth.PersistSession(r.Context(), client, user.ID, r); err != nil {
			http.Error(w, "failed to persist session", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(user)
	}
}

func HandleAuthUser(client *ent.Client, authenticate func(http.Handler) http.Handler, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasSuffix(r.URL.Path, "/user") {
			if strings.HasSuffix(r.URL.Path, "/logout") {
				_ = appauth.RevokeSession(r.Context(), client, r)
			}
			next.ServeHTTP(w, r)
			return
		}
		authenticate(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			providerUser, err := token.GetUserInfo(r)
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			user, err := appauth.PersistUser(r.Context(), client, providerUser)
			if err != nil {
				http.Error(w, "failed to persist user", http.StatusInternalServerError)
				return
			}
			if err := appauth.PersistSession(r.Context(), client, user.ID, r); err != nil {
				http.Error(w, "failed to persist session", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(user)
		})).ServeHTTP(w, r)
	})
}
