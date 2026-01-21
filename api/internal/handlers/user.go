package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/user"
	"github.com/danirisdiandita/malas-monorepo/api/internal/auth"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

type GoogleLoginRequest struct {
	IDToken string `json:"idToken"`
}

type LoginResponse struct {
	User  *ent.User `json:"user"`
	Token string    `json:"token"`
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

		// Generate JWT Token
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub":   u.ID,
			"email": u.Email,
			"exp":   time.Now().Add(time.Hour * 72).Unix(),
		})

		tokenString, err := token.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			http.Error(w, "failed to generate token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(LoginResponse{
			User:  u,
			Token: tokenString,
		})
	}
}

func HandleMe(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("This is a protected route!"))
}
