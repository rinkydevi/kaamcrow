package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/naveensiwach/task-management/internal/auth"
)

type contextKey string

const (
	ContextKeyUserID contextKey = "userID"
	ContextKeyRole   contextKey = "role"
)

func Authenticate(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if !strings.HasPrefix(header, "Bearer ") {
				http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			tokenStr := strings.TrimPrefix(header, "Bearer ")
			claims, err := auth.ValidateToken(tokenStr, jwtSecret)
			if err != nil {
				http.Error(w, `{"error":"invalid or expired token"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), ContextKeyUserID, claims.UserID)
			ctx = context.WithValue(ctx, ContextKeyRole, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, _ := r.Context().Value(ContextKeyRole).(string)
		if role != "admin" {
			http.Error(w, `{"error":"forbidden"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func UserIDFromCtx(ctx context.Context) string {
	v, _ := ctx.Value(ContextKeyUserID).(string)
	return v
}

func RoleFromCtx(ctx context.Context) string {
	v, _ := ctx.Value(ContextKeyRole).(string)
	return v
}
