package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/danirisdiandita/malas-monorepo/api/internal/db"
	_ "github.com/lib/pq"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run cmd/migrate/main.go [up|seed]")
		os.Exit(1)
	}

	cmd := os.Args[1]
	cfg := config.LoadConfig()

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL must be set in .env")
	}

	client, err := db.NewClient(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer client.Close()

	ctx := context.Background()

	switch cmd {
	case "up":
		fmt.Println("Running schema migration...")
		// db.NewClient already runs migration, but we can call it again to be explicit
		if err := client.Schema.Create(ctx); err != nil {
			log.Fatalf("failed to create schema resources: %v", err)
		}
		fmt.Println("Migration completed successfully!")

		// Check for seed flag
		if len(os.Args) > 2 && os.Args[2] == "seed" {
			seed(ctx, client)
		}

	case "seed":
		seed(ctx, client)

	default:
		fmt.Printf("Unknown command: %s\n", cmd)
		os.Exit(1)
	}
}

func seed(ctx context.Context, client *ent.Client) {

	fmt.Println("Running database seeding...")
	// Add your seeding logic here using Ent client
	// Example:
	// _, err := client.User.Create().
	//     SetGoogleID("seed-1").
	//     SetEmail("admin@malas.com").
	//     SetName("Admin Malas").
	//     Save(ctx)
	// if err != nil {
	//     log.Printf("Warning: Seeding skip because error (maybe data exists): %v", err)
	// }
	fmt.Println("Seeding completed!")
}
