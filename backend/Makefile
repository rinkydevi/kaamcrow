include .env
export

.PHONY: run build migrate-up migrate-down test

run:
	go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

migrate-up:
	psql $(DATABASE_URL) -f db/migrations/000001_init.up.sql
	psql $(DATABASE_URL) -f db/migrations/000002_extras.up.sql
	psql $(DATABASE_URL) -f db/migrations/000003_perf.up.sql
	psql $(DATABASE_URL) -f db/migrations/000004_trgm.up.sql

migrate-down:
	psql $(DATABASE_URL) -f db/migrations/000004_trgm.down.sql
	psql $(DATABASE_URL) -f db/migrations/000003_perf.down.sql
	psql $(DATABASE_URL) -f db/migrations/000002_extras.down.sql
	psql $(DATABASE_URL) -f db/migrations/000001_init.down.sql

test:
	go test ./...

tidy:
	go mod tidy
