package db

import (
	"log"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	_ "github.com/lib/pq"
)

func NewClient(dbURL string) (*ent.Client, error) {
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	client, err := ent.Open("postgres", dbURL)

	if err != nil {
		return nil, err
	}

	return client, nil
}
