package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment          string
	Port                 string
	DatabaseURL          string
	GoogleClientID       string
	GoogleClientSecret   string
	AppleClientID        string
	AppleTeamID          string
	AppleKeyID           string
	ApplePrivateKeyPath  string
	AuthURL              string
	JWTSecret            string
	WebhookDebugDir      string
	WebhookDebugSecret   string
	Apify                ApifyConfig
	ImportWebhookSecret  string
	OpenRouterKey        string
	OpenRouterModel      string
	OpenRouterVideoModel string
	OpenRouterURL        string
	S3                   S3Config
}

type S3Config struct {
	Endpoint, PublicEndpoint, Port, AccessKey, SecretKey, Region, Bucket string
	UseSSL                                                               bool
}

type ApifyConfig struct {
	APIToken                  string
	DebugDir                  string
	TikTokActorURL            string
	FacebookReelsActorURL     string
	FacebookPostsActorURL     string
	InstagramActorURL         string
	InstagramReelsActorURL    string
	PinterestActorURL         string
	YouTubeActorURL           string
	YouTubeTranscriptActorURL string
	WebActorURL               string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	return &Config{
		Environment:         getEnv("ENV", "development"),
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
			APIToken:                  getEnv("APIFY_API_TOKEN", ""),
			DebugDir:                  getEnv("APIFY_DEBUG_DIR", "./debug/apify"),
			TikTokActorURL:            getEnv("APIFY_TIKTOK_ACTOR_URL", "https://api.apify.com/v2/acts/scraptik~tiktok-api/runs"),
			FacebookReelsActorURL:     getEnv("APIFY_FACEBOOK_REELS_ACTOR_URL", "https://api.apify.com/v2/actors/scraperdataworld~facebook-reels-scraper/runs"),
			FacebookPostsActorURL:     getEnv("APIFY_FACEBOOK_POSTS_ACTOR_URL", "https://api.apify.com/v2/actors/apify~facebook-posts-scraper/runs"),
			InstagramActorURL:         getEnv("APIFY_INSTAGRAM_ACTOR_URL", "https://api.apify.com/v2/actors/apify~instagram-scraper/runs"),
			InstagramReelsActorURL:    getEnv("APIFY_INSTAGRAM_REELS_ACTOR_URL", "https://api.apify.com/v2/actors/apify~instagram-reel-scraper/runs"),
			PinterestActorURL:         getEnv("APIFY_PINTEREST_ACTOR_URL", "https://api.apify.com/v2/actors/fatihtahta~pinterest-scraper-search/runs"),
			YouTubeActorURL:           getEnv("APIFY_YOUTUBE_ACTOR_URL", "https://api.apify.com/v2/actors/streamers~youtube-scraper/runs"),
			YouTubeTranscriptActorURL: getEnv("APIFY_YOUTUBE_TRANSCRIPT_ACTOR_URL", "https://api.apify.com/v2/actors/johnvc~youtubetranscripts/runs"),
			WebActorURL:               getEnv("APIFY_WEB_ACTOR_URL", "https://api.apify.com/v2/actors/apify~website-content-crawler/runs"),
		},
		ImportWebhookSecret:  getEnv("IMPORT_WEBHOOK_SECRET", getEnv("TIKTOK_WEBHOOK_SECRET", "")),
		OpenRouterKey:        getEnv("OPENROUTER_API_KEY", ""),
		OpenRouterModel:      getEnv("OPENROUTER_MODEL", "openai/gpt-5.6-luna"),
		OpenRouterVideoModel: getEnv("OPENROUTER_VIDEO_MODEL", "google/gemini-3.5-flash-lite"),
		OpenRouterURL:        getEnv("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions"),
		S3: S3Config{Endpoint: getEnv("S3_ENDPOINT", ""), PublicEndpoint: getEnv("S3_PUBLIC_ENDPOINT", ""), Port: getEnv("S3_PORT", ""),
			AccessKey: getEnv("S3_ACCESS_KEY", ""), SecretKey: getEnv("S3_SECRET_KEY", ""),
			Region: getEnv("S3_REGION", "auto"), Bucket: getEnv("S3_BUCKET", ""),
			UseSSL: getEnv("S3_USE_SSL", "true") == "true"},
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
