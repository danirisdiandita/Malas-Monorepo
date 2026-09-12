package recipes

import (
	"github.com/danirisdiandita/malas-monorepo/api/ent"
	"github.com/danirisdiandita/malas-monorepo/api/ent/account"
	"github.com/danirisdiandita/malas-monorepo/api/ent/user"
	"github.com/go-pkgz/auth/v2/token"
	"net/http"
)

func OwnerID(db *ent.Client, r *http.Request) (int, error) {
	info, err := token.GetUserInfo(r)
	if err != nil {
		return 0, err
	}
	owner, err := db.User.Query().Where(user.HasAccountsWith(account.ProviderAccountID(info.ID))).Only(r.Context())
	if err != nil {
		return 0, err
	}
	return owner.ID, nil
}
