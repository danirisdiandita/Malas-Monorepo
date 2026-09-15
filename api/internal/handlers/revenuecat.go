package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/account"
	"github.com/danirisdiandita/malas-monorepo/api/ent/revenuecatidentity"
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
