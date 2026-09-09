package main

import (
	"context"
	"crypto/sha1"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"time"

	appauth "github.com/danirisdiandita/malas-monorepo/api/internal/auth"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/danirisdiandita/malas-monorepo/api/internal/db"
	"github.com/danirisdiandita/malas-monorepo/api/internal/handlers"
	tiktok "github.com/danirisdiandita/malas-monorepo/api/internal/imports"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
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
	if cfg.DatabaseURL == "" || cfg.JWTSecret == "" {
		log.Fatal("DATABASE_URL and JWT_SECRET must be set")
	}
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
		TokenDuration:     15 * time.Minute,
		CookieDuration:    30 * 24 * time.Hour,
		Issuer:            "my-test-app",
		URL:               cfg.AuthURL,
		AvatarStore:       avatar.NewLocalFS("/tmp"),
		Validator: token.ValidatorFunc(func(_ string, claims token.Claims) bool {
			return claims.User != nil && claims.User.ID != ""
		}),
	}

	service := auth.NewService(options)
	accessTokens := token.NewService(token.Opts{
		SecretReader:  token.SecretFunc(func(_ string) (string, error) { return cfg.JWTSecret, nil }),
		SecureCookies: secureCookies, SameSite: sameSite, Issuer: "my-test-app",
		TokenDuration: 15 * time.Minute, CookieDuration: 30 * 24 * time.Hour,
	})
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
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:8081"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-XSRF-TOKEN", "X-JWT", "X-Refresh-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public Routes
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Malas API is running!"))
	})
	r.Mount("/auth", handlers.HandleAuthUser(client, m.Auth, authRoutes, accessTokens, secureCookies, sameSite))
	r.Mount("/avatar", avatarRoutes)
	r.Get("/recipes", recipes.HandleList)
	r.Get("/recipes/{id}", recipes.HandleGet)
	r.Post("/webhooks/debug", handlers.HandleDebugWebhook(cfg.WebhookDebugDir, cfg.WebhookDebugSecret))
	r.Post("/imports/tiktok", tiktok.Handle(cfg.ApifyAPIToken, cfg.ApifyDebugDir))

	// Protected Routes
	r.Group(func(r chi.Router) {
		r.Use(m.Auth)
		r.Use(appauth.RequireSession(client))
		r.Get("/me", handlers.HandleMe(client))
	})

	server := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	serverErr := make(chan error, 1)
	go func() {
		fmt.Printf("Server starting on port %s...\n", cfg.Port)
		serverErr <- server.ListenAndServe()
	}()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	select {
	case err := <-serverErr:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			log.Printf("graceful shutdown failed: %v", err)
		}
	}
}
