package middleware

import (
	"net/http"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// This is a placeholder. In a real app, you'd check for a session or your own JWT.
		// For now, we'll just check if the Authorization header is present.
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
