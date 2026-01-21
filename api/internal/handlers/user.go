package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/refreshtoken"
	"github.com/danirisdiandita/malas-monorepo/api/ent/user"
	"github.com/danirisdiandita/malas-monorepo/api/internal/auth"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

type GoogleLoginRequest struct {
	IDToken string `json:"idToken"`
}

type LoginResponse struct {
	User         *ent.User `json:"user"`
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
}

func generateRandomString(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return hex.EncodeToString(b)
}

func HandleGoogleLogin(client *ent.Client, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req GoogleLoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		googleUser, err := auth.VerifyGoogleToken(r.Context(), req.IDToken, cfg.GoogleClientID)
		if err != nil {
			http.Error(w, "invalid id token", http.StatusUnauthorized)
			return
		}

		// Find or Create user in DB
		u, err := client.User.Query().
			Where(user.GoogleID(googleUser.ID)).
			Only(r.Context())

		if ent.IsNotFound(err) {
			u, err = client.User.Create().
				SetGoogleID(googleUser.ID).
				SetEmail(googleUser.Email).
				SetName(googleUser.Name).
				SetPicture(googleUser.Picture).
				Save(r.Context())
		} else if err == nil {
			u, err = u.Update().
				SetEmail(googleUser.Email).
				SetName(googleUser.Name).
				SetPicture(googleUser.Picture).
				Save(r.Context())
		}

		if err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}

		// Generate Access Token (short-lived)
		accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub":   u.ID,
			"email": u.Email,
			"exp":   time.Now().Add(time.Minute * 15).Unix(), // 15 minutes
		})

		accessTokenString, err := accessToken.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			http.Error(w, "failed to generate access token", http.StatusInternalServerError)
			return
		}

		// Generate Refresh Token (long-lived)
		rt := generateRandomString(32)
		_, err = client.RefreshToken.Create().
			SetToken(rt).
			SetExpiresAt(time.Now().Add(time.Hour * 24 * 7)). // 7 days
			SetOwner(u).
			Save(r.Context())

		if err != nil {
			http.Error(w, "failed to save refresh token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(LoginResponse{
			User:         u,
			AccessToken:  accessTokenString,
			RefreshToken: rt,
		})
	}
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type RefreshResponse struct {
	AccessToken string `json:"accessToken"`
}

func HandleRefreshToken(client *ent.Client, cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req RefreshRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}

		// Validate refresh token
		rt, err := client.RefreshToken.Query().
			Where(refreshtoken.Token(req.RefreshToken)).
			WithOwner().
			Only(r.Context())

		if err != nil {
			http.Error(w, "invalid refresh token", http.StatusUnauthorized)
			return
		}

		if rt.ExpiresAt.Before(time.Now()) {
			client.RefreshToken.DeleteOne(rt).Exec(r.Context())
			http.Error(w, "refresh token expired", http.StatusUnauthorized)
			return
		}

		u := rt.Edges.Owner

		// Generate new Access Token
		accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub":   u.ID,
			"email": u.Email,
			"exp":   time.Now().Add(time.Minute * 15).Unix(),
		})

		accessTokenString, err := accessToken.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			http.Error(w, "failed to generate access token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(RefreshResponse{
			AccessToken: accessTokenString,
		})
	}
}

func HandleMe(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("This is a protected route!"))
}
