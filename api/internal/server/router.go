package server

import (
	"net/http"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/danirisdiandita/malas-monorepo/api/internal/handlers"
	"github.com/danirisdiandita/malas-monorepo/api/internal/imports"
	"github.com/danirisdiandita/malas-monorepo/api/internal/recipes"
	"github.com/go-chi/chi/v5"
	mid "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-pkgz/auth/v2/token"
)

type Dependencies struct {
	Imports        *imports.Pipeline
	Config         *config.Config
	DB             *ent.Client
	Authenticate   func(http.Handler) http.Handler
	RequireSession func(http.Handler) http.Handler
	AuthRoutes     http.Handler
	AvatarRoutes   http.Handler
	AccessTokens   *token.Service
	SecureCookies  bool
	SameSite       http.SameSite
}

func NewRouter(deps Dependencies) http.Handler {
	r := chi.NewRouter()
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

	r.Get("/", func(w http.ResponseWriter, _ *http.Request) { _, _ = w.Write([]byte("Malas API is running!")) })
	r.Mount("/auth", handlers.HandleAuthUser(deps.DB, deps.Authenticate, deps.AuthRoutes, deps.AccessTokens, deps.SecureCookies, deps.SameSite))
	r.Mount("/avatar", deps.AvatarRoutes)
	r.Get("/swagger", handlers.HandleSwaggerRedirect)
	r.Get("/swagger/", handlers.HandleSwaggerUI)
	r.Get("/swagger/openapi.json", handlers.HandleOpenAPI)
	r.Post("/webhooks/debug", handlers.HandleDebugWebhook(deps.Config.WebhookDebugDir, deps.Config.WebhookDebugSecret))
	r.Post("/webhooks/import", deps.Imports.Receive)

	r.Group(func(r chi.Router) {
		r.Use(deps.Authenticate)
		r.Use(deps.RequireSession)
		r.Get("/me", handlers.HandleMe(deps.DB))
		r.Get("/recipes", recipes.StoredList(deps.DB, deps.Imports.Storage))
		r.Get("/recipes/{id}", recipes.StoredGet(deps.DB, deps.Imports.Storage))
		r.Post("/recipes/{id}/rating", recipes.Rate(deps.DB))
		r.Post("/imports/link", imports.HandleImport(deps.Config.Apify.APIToken, deps.Config.Apify.DebugDir, deps.Config.AuthURL, deps.Config.ImportWebhookSecret, deps.Config.Apify.TikTokActorURL, deps.Config.Apify.FacebookReelsActorURL, deps.Imports))
		r.Get("/imports/{runID}", deps.Imports.Status)
		r.Post("/imports/{runID}/retry", deps.Imports.Retry)
	})
	return r
}
