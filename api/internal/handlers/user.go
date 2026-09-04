package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-pkgz/auth/v2/token"
)

func HandleMe(w http.ResponseWriter, r *http.Request) {
	user, err := token.GetUserInfo(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(user)
}
