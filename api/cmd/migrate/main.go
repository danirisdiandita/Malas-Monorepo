package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/internal/config"
	"github.com/danirisdiandita/malas-monorepo/api/internal/db"
	_ "github.com/lib/pq"
)

const migrationDir = "ent/migrate/migrations"

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
		if err := migrate(ctx, cfg.DatabaseURL); err != nil {
			log.Fatalf("migration failed: %v", err)
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

func migrate(ctx context.Context, databaseURL string) error {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return err
	}
	defer db.Close()
	if err := db.PingContext(ctx); err != nil {
		return err
	}
	if _, err := db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`); err != nil {
		return err
	}

	entries, err := os.ReadDir(migrationDir)
	if err != nil {
		return err
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Name() < entries[j].Name() })
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".sql") {
			continue
		}
		var applied bool
		if err := db.QueryRowContext(ctx, "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)", entry.Name()).Scan(&applied); err != nil {
			return err
		}
		if applied {
			continue
		}
		contents, err := os.ReadFile(migrationDir + "/" + entry.Name())
		if err != nil {
			return err
		}
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		for _, statement := range strings.Split(string(contents), ";") {
			statement = strings.TrimSpace(statement)
			if statement == "" || strings.HasPrefix(statement, "--") {
				continue
			}
			if _, err := tx.ExecContext(ctx, statement); err != nil {
				_ = tx.Rollback()
				return fmt.Errorf("%s: %w", entry.Name(), err)
			}
		}
		if _, err := tx.ExecContext(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", entry.Name()); err != nil {
			_ = tx.Rollback()
			return err
		}
		if err := tx.Commit(); err != nil {
			return err
		}
		fmt.Printf("Applied %s\n", entry.Name())
	}
	return nil
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
