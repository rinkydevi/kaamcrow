package tests

import (
	"testing"

	"github.com/naveensiwach/task-management/internal/auth"
)

func TestHashAndCheckPassword(t *testing.T) {
	plain := "supersecret123"

	hash, err := auth.HashPassword(plain)
	if err != nil {
		t.Fatalf("unexpected error hashing password: %v", err)
	}

	if !auth.CheckPassword(plain, hash) {
		t.Error("expected CheckPassword to return true for correct password")
	}

	if auth.CheckPassword("wrongpassword", hash) {
		t.Error("expected CheckPassword to return false for wrong password")
	}
}

func TestGenerateAndValidateToken(t *testing.T) {
	secret := "test-secret"
	userID := "user-123"
	role := "user"

	token, err := auth.GenerateToken(userID, role, secret)
	if err != nil {
		t.Fatalf("unexpected error generating token: %v", err)
	}

	claims, err := auth.ValidateToken(token, secret)
	if err != nil {
		t.Fatalf("unexpected error validating token: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected userID %q, got %q", userID, claims.UserID)
	}

	if claims.Role != role {
		t.Errorf("expected role %q, got %q", role, claims.Role)
	}
}

func TestValidateToken_WrongSecret(t *testing.T) {
	token, _ := auth.GenerateToken("uid", "user", "secret-a")
	_, err := auth.ValidateToken(token, "secret-b")
	if err == nil {
		t.Error("expected error when validating token with wrong secret")
	}
}
