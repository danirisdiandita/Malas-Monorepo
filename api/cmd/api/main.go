package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/danirisdiandita/malas-monorepo/api/internal/db"
	"github.com/danirisdiandita/malas-monorepo/api/internal/handlers"
	"github.com/danirisdiandita/malas-monorepo/api/internal/middleware"
	"github.com/go-chi/chi/v5"
	mid "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// Load centralized configuration
	cfg := config.LoadConfig()

	// Initialize Ent client
	client, err := db.NewClient(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed initializing database: %v", err)
	}
	defer client.Close()

	r := chi.NewRouter()

	// Middleware
	r.Use(mid.Logger)
	r.Use(mid.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"}, // Adjust as needed
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public Routes
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Malas API is running!"))
	})

	r.Post("/auth/google", handlers.HandleGoogleLogin(client, cfg))

	// Protected Routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware(cfg))
		r.Get("/me", handlers.HandleMe)
	})

	fmt.Printf("Server starting on port %s...\n", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatal(err)
	}
}
