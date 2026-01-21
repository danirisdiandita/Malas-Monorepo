# Run the API server
dev:
	go run cmd/api/main.go

# Run database migrations
migrate-up:
	go run cmd/migrate/main.go up

# Run database migrations with seeds (placeholder for logic)
migrate-up-seed:
	go run cmd/migrate/main.go up seed

# Generate Ent code
generate:
	go generate ./ent

# Install dependencies
install:
	go mod tidy
