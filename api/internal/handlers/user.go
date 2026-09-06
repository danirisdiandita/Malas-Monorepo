package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/account"
	entuser "github.com/danirisdiandita/malas-monorepo/api/ent/user"
	appauth "github.com/danirisdiandita/malas-monorepo/api/internal/auth"
	"github.com/go-pkgz/auth/v2/token"
	"github.com/golang-jwt/jwt/v5"
)

type authResponse struct {
	*ent.User
	AccessToken  string `json:"access_token,omitempty"`
	RefreshToken string `json:"refresh_token,omitempty"`
}

func HandleRefresh(client *ent.Client, jwtService *token.Service, secureCookies bool, sameSite http.SameSite) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", http.MethodPost)
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		value := appauth.RefreshTokenFromRequest(r)
		rotated, user, err := appauth.RotateRefreshToken(r.Context(), client, value)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		linked, err := client.Account.Query().Where(account.HasUserWith(entuser.IDEQ(user.ID))).First(r.Context())
		if err != nil {
			http.Error(w, "user account is missing", http.StatusInternalServerError)
			return
		}
		claims := token.Claims{
			RegisteredClaims: jwt.RegisteredClaims{Audience: []string{"my-test-app"}},
			User:             &token.User{ID: linked.ProviderAccountID, Name: user.Name, Email: user.Email, Picture: user.Picture},
			AuthProvider:     &token.AuthProvider{Name: linked.Provider},
		}
		// The cookie is useful for the dashboard; mobile reads the same token from JSON.
		if _, err := jwtService.Set(w, claims); err != nil {
			http.Error(w, "failed to issue access token", http.StatusInternalServerError)
			return
		}
		http.SetCookie(w, &http.Cookie{Name: "REFRESH_TOKEN", Value: rotated, HttpOnly: true, Secure: secureCookies, SameSite: sameSite, Path: "/", MaxAge: int(appauth.RefreshTokenDuration / time.Second)})
		access := jwtCookie(w.Header().Values("Set-Cookie"))
		w.Header().Set("Content-Type", "application/json")
		response := authResponse{User: user}
		if r.Header.Get("X-Refresh-Token") != "" {
			response.AccessToken, response.RefreshToken = access, rotated
		}
		_ = json.NewEncoder(w).Encode(response)
	}
}

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

func HandleAuthUser(client *ent.Client, authenticate func(http.Handler) http.Handler, next http.Handler, settings ...interface{}) http.Handler {
	jwtService := token.NewService(token.Opts{})
	secureCookies, sameSite := false, http.SameSiteLaxMode
	if len(settings) > 0 {
		jwtService, _ = settings[0].(*token.Service)
	}
	if len(settings) > 1 {
		secureCookies, _ = settings[1].(bool)
	}
	if len(settings) > 2 {
		sameSite, _ = settings[2].(http.SameSite)
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/refresh") {
			HandleRefresh(client, jwtService, secureCookies, sameSite).ServeHTTP(w, r)
			return
		}
		if strings.HasSuffix(r.URL.Path, "/callback") {
			w = oauthCallbackWriter{ResponseWriter: w, forceGet: r.Method == http.MethodPost}
		}
		if !strings.HasSuffix(r.URL.Path, "/user") {
			if strings.HasSuffix(r.URL.Path, "/logout") {
				_ = appauth.RevokeSession(r.Context(), client, r)
				_ = appauth.RevokeRefreshToken(r.Context(), client, appauth.RefreshTokenFromRequest(r))
				http.SetCookie(w, &http.Cookie{Name: "REFRESH_TOKEN", MaxAge: -1, Path: "/"})
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
			refresh := ""
			mobile := r.Header.Get("X-JWT") != ""
			if appauth.RefreshTokenFromRequest(r) == "" {
				refresh, err = appauth.CreateRefreshToken(r.Context(), client, user.ID)
				if err != nil {
					http.Error(w, "failed to create refresh token", http.StatusInternalServerError)
					return
				}
				http.SetCookie(w, &http.Cookie{Name: "REFRESH_TOKEN", Value: refresh, HttpOnly: true, Secure: secureCookies, SameSite: sameSite, Path: "/", MaxAge: int(appauth.RefreshTokenDuration / time.Second)})
			}
			w.Header().Set("Content-Type", "application/json")
			if !mobile {
				refresh = ""
			}
			_ = json.NewEncoder(w).Encode(authResponse{User: user, RefreshToken: refresh})
		})).ServeHTTP(w, r)
	})
}

type oauthCallbackWriter struct {
	http.ResponseWriter
	forceGet bool
}

func (w oauthCallbackWriter) WriteHeader(status int) {
	if w.forceGet && status == http.StatusTemporaryRedirect {
		status = http.StatusSeeOther
	}
	if location := w.Header().Get("Location"); location != "" {
		if target, err := url.Parse(location); err == nil && isAppRedirect(target) {
			if jwt := jwtCookie(w.Header().Values("Set-Cookie")); jwt != "" {
				query := target.Query()
				query.Set("token", jwt)
				target.RawQuery = query.Encode()
				w.Header().Set("Location", target.String())
			}
		}
	}
	w.ResponseWriter.WriteHeader(status)
}

func isAppRedirect(target *url.URL) bool {
	return target.Scheme != "" && target.Scheme != "http" && target.Scheme != "https"
}

func jwtCookie(setCookies []string) string {
	for _, setCookie := range setCookies {
		value := strings.TrimSpace(strings.SplitN(setCookie, ";", 2)[0])
		name, token, ok := strings.Cut(value, "=")
		if ok && name == "JWT" {
			return token
		}
	}
	return ""
}
