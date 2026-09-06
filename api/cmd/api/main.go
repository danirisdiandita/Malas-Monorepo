package main

import (
	"crypto/sha1"
	"fmt"
	"log"
	"net/http"
	"strings"

	"time"

	appauth "github.com/danirisdiandita/malas-monorepo/api/internal/auth"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/danirisdiandita/malas-monorepo/api/internal/db"
	"github.com/danirisdiandita/malas-monorepo/api/internal/handlers"
	"github.com/go-chi/chi/v5"
	mid "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-pkgz/auth/v2"
	"github.com/go-pkgz/auth/v2/avatar"
	"github.com/go-pkgz/auth/v2/provider"
	"github.com/go-pkgz/auth/v2/token"
	"golang.org/x/oauth2/google"
)

func main() {
	// Load centralized configuration
	cfg := config.LoadConfig()
	secureCookies := strings.HasPrefix(cfg.AuthURL, "https://")
	sameSite := http.SameSiteLaxMode
	if secureCookies {
		sameSite = http.SameSiteNoneMode
	}

	// Initialize Ent client
	client, err := db.NewClient(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed initializing database: %v", err)
	}
	defer client.Close()

	// define options
	options := auth.Opts{
		SecretReader: token.SecretFunc(func(_ string) (string, error) {
			return cfg.JWTSecret, nil
		}),
		SecureCookies:     secureCookies,
		SameSiteCookie:    sameSite,
		XSRFIgnoreMethods: []string{"GET"},
		TokenDuration:     time.Minute * 5, // token expires in 5 minutes
		CookieDuration:    time.Hour * 24,  // cookie expires in 1 day and will enforce re-login
		Issuer:            "my-test-app",
		URL:               cfg.AuthURL,
		AvatarStore:       avatar.NewLocalFS("/tmp"),
		Validator: token.ValidatorFunc(func(_ string, claims token.Claims) bool {
			return claims.User != nil && claims.User.ID != ""
		}),
	}

	service := auth.NewService(options)
	service.AddCustomProvider("google", auth.Client{Cid: cfg.GoogleClientID, Csecret: cfg.GoogleClientSecret}, provider.CustomHandlerOpt{
		Endpoint: google.Endpoint,
		InfoURL:  "https://www.googleapis.com/oauth2/v3/userinfo",
		Scopes:   []string{"openid", "profile", "email"},
		MapUserFn: func(data provider.UserData, _ []byte) token.User {
			id := "google_" + token.HashID(sha1.New(), data.Value("sub"))
			return token.User{
				ID:      id,
				Name:    data.Value("name"),
				Picture: data.Value("picture"),
				Email:   data.Value("email"),
			}
		},
	})
	if cfg.ApplePrivateKeyPath != "" {
		if err := service.AddAppleProvider(provider.AppleConfig{
			ClientID: cfg.AppleClientID,
			TeamID:   cfg.AppleTeamID,
			KeyID:    cfg.AppleKeyID,
		}, provider.LoadApplePrivateKeyFromFile(cfg.ApplePrivateKeyPath)); err != nil {
			log.Fatalf("failed to configure Apple auth: %v", err)
		}
	}

	m := service.Middleware()
	authRoutes, avatarRoutes := service.Handlers()

	r := chi.NewRouter()

	// Middleware
	r.Use(mid.Logger)
	r.Use(mid.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-XSRF-TOKEN"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public Routes
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Malas API is running!"))
	})
	r.Mount("/auth", handlers.HandleAuthUser(client, m.Auth, authRoutes))
	r.Mount("/avatar", avatarRoutes)

	// Protected Routes
	r.Group(func(r chi.Router) {
		r.Use(m.Auth)
		r.Use(appauth.RequireSession(client))
		r.Get("/me", handlers.HandleMe(client))
	})

	fmt.Printf("Server starting on port %s...\n", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
