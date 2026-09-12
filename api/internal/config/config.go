package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	GoogleClientID      string
	GoogleClientSecret  string
	AppleClientID       string
	AppleTeamID         string
	AppleKeyID          string
	ApplePrivateKeyPath string
	AuthURL             string
	JWTSecret           string
	WebhookDebugDir     string
	WebhookDebugSecret  string
	Apify               ApifyConfig
	ImportWebhookSecret string
}

type ApifyConfig struct {
	APIToken              string
	DebugDir              string
	TikTokActorURL        string
	FacebookReelsActorURL string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	return &Config{
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         getEnv("DATABASE_URL", ""),
		GoogleClientID:      getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret:  getEnv("GOOGLE_CLIENT_SECRET", ""),
		AppleClientID:       getEnv("APPLE_CLIENT_ID", ""),
		AppleTeamID:         getEnv("APPLE_TEAM_ID", ""),
		AppleKeyID:          getEnv("APPLE_KEY_ID", ""),
		ApplePrivateKeyPath: getEnv("APPLE_PRIVATE_KEY_PATH", ""),
		AuthURL:             getEnv("AUTH_URL", "http://localhost:8080"),
		JWTSecret:           getEnv("JWT_SECRET", ""),
		WebhookDebugDir:     getEnv("WEBHOOK_DEBUG_DIR", "./debug/webhooks"),
		WebhookDebugSecret:  getEnv("WEBHOOK_DEBUG_SECRET", ""),
		Apify: ApifyConfig{
			APIToken:              getEnv("APIFY_API_TOKEN", ""),
			DebugDir:              getEnv("APIFY_DEBUG_DIR", "./debug/apify"),
			TikTokActorURL:        getEnv("APIFY_TIKTOK_ACTOR_URL", "https://api.apify.com/v2/acts/scraptik~tiktok-api/runs"),
			FacebookReelsActorURL: getEnv("APIFY_FACEBOOK_REELS_ACTOR_URL", "https://api.apify.com/v2/actors/dami_studio~facebook-posts-scraper/runs"),
		},
		ImportWebhookSecret: getEnv("IMPORT_WEBHOOK_SECRET", getEnv("TIKTOK_WEBHOOK_SECRET", "")),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
