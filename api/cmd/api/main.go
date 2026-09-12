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
	"github.com/danirisdiandita/malas-monorepo/api/internal/imports"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	appserver "github.com/danirisdiandita/malas-monorepo/api/internal/server"
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
	var storage *recipes.Storage
	if cfg.S3.Endpoint != "" {
		storage, err = recipes.NewStorage(cfg.S3)
		if err != nil {
			log.Fatalf("image storage: %v", err)
		}
	}
	pipeline := &imports.Pipeline{DB: client, Config: cfg, Storage: storage, Client: &http.Client{Timeout: 180 * time.Second}}

	r := appserver.NewRouter(appserver.Dependencies{
		Imports:        pipeline,
		Config:         cfg,
		DB:             client,
		Authenticate:   m.Auth,
		RequireSession: appauth.RequireSession(client),
		AuthRoutes:     authRoutes,
		AvatarRoutes:   avatarRoutes,
		AccessTokens:   accessTokens,
		SecureCookies:  secureCookies,
		SameSite:       sameSite,
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
	workerDone := make(chan struct{})
	go func() { defer close(workerDone); pipeline.Run(ctx) }()
	defer func() { stop(); <-workerDone }()
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
