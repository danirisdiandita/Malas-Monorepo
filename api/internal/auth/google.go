package auth

import (
	"context"

	"google.golang.org/api/idtoken"
)

type GoogleUser struct {
	ID      string
	Email   string
	Name    string
	Picture string
}

func VerifyGoogleToken(ctx context.Context, token string, clientID string) (*GoogleUser, error) {
	payload, err := idtoken.Validate(ctx, token, clientID)
	if err != nil {
		return nil, err
	}

	return &GoogleUser{
		ID:      payload.Subject,
		Email:   payload.Claims["email"].(string),
		Name:    payload.Claims["name"].(string),
		Picture: payload.Claims["picture"].(string),
	}, nil
}
