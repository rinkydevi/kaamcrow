package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/naveensiwach/task-management/internal/auth"
	"github.com/naveensiwach/task-management/internal/models"
	"github.com/naveensiwach/task-management/internal/repository"
)

type AuthHandler struct {
	users     *repository.UserRepository
	validate  *validator.Validate
	jwtSecret string
}

func NewAuthHandler(users *repository.UserRepository, jwtSecret string) *AuthHandler {
	return &AuthHandler{users: users, validate: validator.New(), jwtSecret: jwtSecret}
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req models.SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	existing, _ := h.users.FindByEmail(r.Context(), req.Email)
	if existing != nil {
		writeError(w, http.StatusConflict, "email already in use")
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	user, err := h.users.Create(r.Context(), req.Email, hash)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	token, err := auth.GenerateToken(user.ID, string(user.Role), h.jwtSecret)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	writeJSON(w, http.StatusCreated, models.AuthResponse{Token: token, User: user})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	user, err := h.users.FindByEmail(r.Context(), req.Email)
	if err != nil || user == nil || !auth.CheckPassword(req.Password, user.PasswordHash) {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := auth.GenerateToken(user.ID, string(user.Role), h.jwtSecret)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	writeJSON(w, http.StatusOK, models.AuthResponse{Token: token, User: user})
}
