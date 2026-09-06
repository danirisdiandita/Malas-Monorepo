package auth

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/account"
	"github.com/danirisdiandita/malas-monorepo/api/ent/session"
	"github.com/danirisdiandita/malas-monorepo/api/ent/user"
	"github.com/go-pkgz/auth/v2/token"
)

func PersistUser(ctx context.Context, client *ent.Client, providerUser token.User) (*ent.User, error) {
	providerName, _, _ := strings.Cut(providerUser.ID, "_")
	if providerName == "" || providerUser.ID == "" {
		return nil, fmt.Errorf("provider user id is required")
	}

	tx, err := client.Tx(ctx)
	if err != nil {
		return nil, err
	}
	accountQuery := tx.Account.Query().Where(
		account.Provider(providerName),
		account.ProviderAccountID(providerUser.ID),
	)
	linked, err := accountQuery.WithUser().Only(ctx)
	if err == nil {
		updated, updateErr := updateUser(ctx, tx, linked.Edges.User, providerUser)
		if updateErr != nil {
			_ = tx.Rollback()
			return nil, updateErr
		}
		if err = tx.Commit(); err != nil {
			return nil, err
		}
		return updated, nil
	}
	if !ent.IsNotFound(err) {
		_ = tx.Rollback()
		return nil, err
	}

	var local *ent.User
	if providerUser.Email != "" {
		local, err = tx.User.Query().Where(user.Email(providerUser.Email)).Only(ctx)
		if err != nil && !ent.IsNotFound(err) {
			_ = tx.Rollback()
			return nil, err
		}
	}
	if local == nil {
		email := providerUser.Email
		if email == "" {
			email = fmt.Sprintf("%s@%s.invalid", providerUser.ID, providerName)
		}
		local, err = tx.User.Create().
			SetEmail(email).
			SetName(providerUser.Name).
			SetPicture(providerUser.Picture).
			SetEmailVerified(providerUser.Email != "").
			Save(ctx)
		if err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	}

	_, err = tx.Account.Create().
		SetProvider(providerName).
		SetProviderAccountID(providerUser.ID).
		SetUserID(local.ID).
		Save(ctx)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return local, nil
}

func updateUser(ctx context.Context, tx *ent.Tx, local *ent.User, providerUser token.User) (*ent.User, error) {
	update := tx.User.UpdateOneID(local.ID).SetName(providerUser.Name)
	if providerUser.Email != "" {
		update.SetEmail(providerUser.Email).SetEmailVerified(true)
	}
	if providerUser.Picture != "" {
		update.SetPicture(providerUser.Picture)
	}
	return update.Save(ctx)
}

func PersistSession(ctx context.Context, client *ent.Client, userID int, r *http.Request) error {
	token, err := requestToken(r)
	if err != nil {
		return fmt.Errorf("auth token is missing")
	}
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(token)))
	existing, err := client.Session.Query().Where(session.TokenHash(hash)).Only(ctx)
	if err == nil {
		_, err = existing.Update().SetLastSeenAt(time.Now()).ClearRevokedAt().Save(ctx)
		return err
	}
	if !ent.IsNotFound(err) {
		return err
	}
	_, err = client.Session.Create().
		SetTokenHash(hash).
		SetExpiresAt(time.Now().Add(24 * time.Hour)).
		SetIPAddress(r.RemoteAddr).
		SetUserAgent(r.UserAgent()).
		SetUserID(userID).
		Save(ctx)
	return err
}

func RevokeSession(ctx context.Context, client *ent.Client, r *http.Request) error {
	token, err := requestToken(r)
	if err != nil {
		return nil
	}
	hash := fmt.Sprintf("%x", sha256.Sum256([]byte(token)))
	now := time.Now()
	_, err = client.Session.Query().Where(session.TokenHash(hash)).Only(ctx)
	if ent.IsNotFound(err) {
		return nil
	}
	if err != nil {
		return err
	}
	return client.Session.Update().Where(session.TokenHash(hash)).SetRevokedAt(now).Exec(ctx)
}

func RequireSession(client *ent.Client) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token, err := requestToken(r)
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			hash := fmt.Sprintf("%x", sha256.Sum256([]byte(token)))
			_, err = client.Session.Query().Where(
				session.TokenHash(hash),
				session.RevokedAtIsNil(),
				session.ExpiresAtGT(time.Now()),
			).Only(r.Context())
			if err != nil {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func requestToken(r *http.Request) (string, error) {
	if token := r.Header.Get("X-JWT"); token != "" {
		return token, nil
	}
	cookie, err := r.Cookie("JWT")
	if err != nil || cookie.Value == "" {
		return "", fmt.Errorf("auth token is missing")
	}
	return cookie.Value, nil
}
