package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL   string
	JWTSecret     string
	Port          string
	AllowedOrigin string
	UploadsDir    string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, using environment variables")
	}

	return &Config{
		DatabaseURL:   mustGet("DATABASE_URL"),
		JWTSecret:     mustGet("JWT_SECRET"),
		Port:          getOrDefault("PORT", "8080"),
		AllowedOrigin: getOrDefault("ALLOWED_ORIGIN", "http://localhost:3000"),
		UploadsDir:    getOrDefault("UPLOADS_DIR", "./uploads"),
	}
}

func mustGet(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required env var %s is not set", key)
	}
	return v
}

func getOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
