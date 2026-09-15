package handlers

import (
	"net/http"

	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/account"
	"github.com/danirisdiandita/malas-monorepo/api/ent/user"
	"github.com/go-pkgz/auth/v2/token"
)

func HandleDeleteAccount(client *ent.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		info, err := token.GetUserInfo(r)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		owner, err := client.User.Query().Where(user.HasAccountsWith(account.ProviderAccountID(info.ID))).Only(r.Context())
		if err != nil {
			http.Error(w, "account not found", http.StatusNotFound)
			return
		}
		if err := client.User.DeleteOneID(owner.ID).Exec(r.Context()); err != nil {
			http.Error(w, "unable to delete account", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}
