package handlers

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/account"
	"github.com/danirisdiandita/malas-monorepo/api/ent/revenuecatidentity"
	"github.com/danirisdiandita/malas-monorepo/api/ent/subscription"
	"github.com/danirisdiandita/malas-monorepo/api/ent/user"
	"github.com/go-pkgz/auth/v2/token"
	"github.com/google/uuid"
)

func HandleRevenueCatAppUserID(client *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		providerUser, err := token.GetUserInfo(r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}

		owner, err := client.User.Query().Where(user.HasAccountsWith(account.ProviderAccountID(providerUser.ID))).Only(r.Context())
		if err != nil {
			http.Error(w, "user not found", http.StatusNotFound)
			return
		}

		identity, err := client.RevenueCatIdentity.Query().Where(revenuecatidentity.UserIDEQ(owner.ID)).First(r.Context())
		if ent.IsNotFound(err) {
			identity, err = client.RevenueCatIdentity.Create().SetUserID(owner.ID).SetRcAppUserID("yuzu_" + uuid.NewString()).Save(r.Context())
		}
		if err != nil {
			http.Error(w, "unable to create RevenueCat identity", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"rc_app_user_id": identity.RcAppUserID})
	}
}

type revenueCatEvent struct {
	Type            string   `json:"type"`
	AppUserID       string   `json:"app_user_id"`
	ProductID       string   `json:"product_id"`
	Store           string   `json:"store"`
	Environment     string   `json:"environment"`
	PurchasedAtMS   *int64   `json:"purchased_at_ms"`
	ExpirationAtMS  *int64   `json:"expiration_at_ms"`
	TransferredFrom []string `json:"transferred_from"`
	TransferredTo   []string `json:"transferred_to"`
}

type revenueCatWebhook struct {
	Event revenueCatEvent `json:"event"`
}

func HandleRevenueCatWebhook(client *ent.Client, secret, projectID, apiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if secret == "" || !validRevenueCatAuthorization(r, secret) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var payload revenueCatWebhook
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&payload); err != nil || payload.Event.Type == "" {
			http.Error(w, "invalid RevenueCat webhook", http.StatusBadRequest)
			return
		}
		if err := persistRevenueCatEvent(r, client, payload.Event, projectID, apiKey); err != nil {
			http.Error(w, "unable to persist RevenueCat webhook", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

func validRevenueCatAuthorization(r *http.Request, secret string) bool {
	value := strings.TrimSpace(r.Header.Get("Authorization"))
	return subtle.ConstantTimeCompare([]byte(value), []byte(secret)) == 1 || subtle.ConstantTimeCompare([]byte(value), []byte("Bearer "+secret)) == 1
}

func persistRevenueCatEvent(r *http.Request, client *ent.Client, event revenueCatEvent, projectID, apiKey string) error {
	switch event.Type {
	case "INITIAL_PURCHASE", "RENEWAL", "TRANSFER", "CANCELLATION", "EXPIRATION", "BILLING_ISSUE", "SUBSCRIPTION_PAUSED":
	default:
		return nil
	}
	if event.Type == "TRANSFER" && (len(event.TransferredFrom) == 0 || len(event.TransferredTo) == 0) {
		return nil
	}
	appUserID := event.AppUserID
	var transferStartDate, transferEndDate *time.Time
	var transferProductID, transferStore, transferEnvironment string
	var transferPaymentProvider string
	if event.Type == "TRANSFER" && len(event.TransferredTo) > 0 {
		appUserID = event.TransferredTo[0]
		if len(event.TransferredFrom) > 0 {
			if previous, err := client.Subscription.Query().Where(subscription.RcAppUserIDEQ(event.TransferredFrom[0])).First(r.Context()); err == nil {
				transferStartDate = previous.StartDate
				transferEndDate = previous.EndDate
				if previous.RcProductID != nil {
					transferProductID = *previous.RcProductID
				}
				if previous.RcStore != nil {
					transferStore = *previous.RcStore
				}
				if previous.RcEnvironment != nil {
					transferEnvironment = *previous.RcEnvironment
				}
				if previous.LatestPaymentProvider != nil {
					transferPaymentProvider = *previous.LatestPaymentProvider
				}
				if transferStartDate == nil {
					now := time.Now()
					transferStartDate = &now
				}
				if transferEndDate == nil {
					fallback := time.Now().AddDate(0, 1, 0)
					transferEndDate = &fallback
				}
				if _, err := client.Subscription.UpdateOneID(previous.ID).SetStatus("TRANSFERRED").SetEndDate(time.Now()).Save(r.Context()); err != nil {
					return err
				}
			} else if !ent.IsNotFound(err) {
				return err
			}
		}
		if transferEndDate == nil && projectID != "" && apiKey != "" {
			if expiresAt, err := getRevenueCatSubscription(r, projectID, apiKey, appUserID); err == nil {
				transferEndDate = expiresAt
			}
		}
		if transferStartDate == nil {
			now := time.Now()
			transferStartDate = &now
		}
		if transferEndDate == nil {
			fallback := time.Now().AddDate(0, 1, 0)
			transferEndDate = &fallback
		}
	}
	if appUserID == "" {
		return nil
	}
	identity, err := client.RevenueCatIdentity.Query().Where(revenuecatidentity.RcAppUserIDEQ(appUserID)).Only(r.Context())
	if ent.IsNotFound(err) {
		return nil
	}
	if err != nil {
		return err
	}
	status := revenueCatStatus(event.Type)
	startDate := revenueCatTime(event.PurchasedAtMS)
	endDate := revenueCatTime(event.ExpirationAtMS)
	if event.Type == "TRANSFER" {
		if event.ProductID == "" {
			event.ProductID = transferProductID
		}
		if event.Store == "" {
			event.Store = transferStore
		}
		if event.Store == "" {
			event.Store = transferPaymentProvider
		}
		if event.Environment == "" {
			event.Environment = transferEnvironment
			if event.Environment == "" {
				event.Environment = "SANDBOX"
			}
		}
		startDate, endDate, status = transferStartDate, transferEndDate, "RESTORED"
	} else if event.Type == "INITIAL_PURCHASE" || event.Type == "RENEWAL" {
		if startDate == nil {
			now := time.Now()
			startDate = &now
		}
		if endDate == nil {
			fallback := time.Now().AddDate(0, 1, 0)
			endDate = &fallback
		}
	}
	row, err := client.Subscription.Query().Where(subscription.RcAppUserIDEQ(appUserID)).First(r.Context())
	if ent.IsNotFound(err) {
		row, err = client.Subscription.Query().Where(subscription.UserIDEQ(identity.UserID)).First(r.Context())
	}
	if err != nil && !ent.IsNotFound(err) {
		return err
	}
	if row == nil {
		create := client.Subscription.Create().SetUserID(identity.UserID).SetCredit(0).SetStatus(status).SetRcAppUserID(appUserID)
		if event.ProductID != "" {
			create.SetRcProductID(event.ProductID)
		}
		if event.Store != "" {
			create.SetRcStore(event.Store)
		}
		if event.Environment != "" {
			create.SetRcEnvironment(event.Environment)
		}
		if event.Store != "" {
			create.SetLatestPaymentProvider(event.Store)
		}
		if startDate != nil {
			create.SetStartDate(*startDate)
		}
		if endDate != nil {
			create.SetEndDate(*endDate)
		}
		_, err = create.Save(r.Context())
		return err
	}
	update := client.Subscription.UpdateOneID(row.ID).SetStatus(status).SetRcAppUserID(appUserID)
	if event.ProductID != "" {
		update.SetRcProductID(event.ProductID)
	}
	if event.Store != "" {
		update.SetRcStore(event.Store)
	}
	if event.Environment != "" {
		update.SetRcEnvironment(event.Environment)
	}
	if event.Store != "" {
		update.SetLatestPaymentProvider(event.Store)
	}
	if startDate != nil {
		update.SetStartDate(*startDate)
	}
	if endDate != nil {
		update.SetEndDate(*endDate)
	}
	_, err = update.Save(r.Context())
	return err
}

func getRevenueCatSubscription(r *http.Request, projectID, apiKey, appUserID string) (*time.Time, error) {
	endpoint := fmt.Sprintf("https://api.revenuecat.com/v2/projects/%s/customers/%s", url.PathEscape(projectID), url.PathEscape(appUserID))
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	client := &http.Client{Timeout: 10 * time.Second}
	response, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("RevenueCat customer lookup returned HTTP %d", response.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	var customer struct {
		ActiveEntitlements struct {
			Items []struct {
				ExpiresAt time.Time `json:"expires_at"`
			} `json:"items"`
		} `json:"active_entitlements"`
	}
	if err := json.Unmarshal(body, &customer); err != nil {
		return nil, err
	}
	if len(customer.ActiveEntitlements.Items) == 0 || customer.ActiveEntitlements.Items[0].ExpiresAt.IsZero() {
		return nil, fmt.Errorf("RevenueCat customer has no active entitlement")
	}
	expiresAt := customer.ActiveEntitlements.Items[0].ExpiresAt
	return &expiresAt, nil
}

func revenueCatTime(value *int64) *time.Time {
	if value == nil || *value <= 0 {
		return nil
	}
	result := time.UnixMilli(*value)
	return &result
}

func revenueCatStatus(eventType string) string {
	switch eventType {
	case "CANCELLATION":
		return "CANCELED"
	case "EXPIRATION":
		return "EXPIRED"
	case "BILLING_ISSUE":
		return "BILLING_ISSUE"
	case "SUBSCRIPTION_PAUSED":
		return "PAUSED"
	default:
		return "ACTIVE"
	}
}
