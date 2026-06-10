package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/naveensiwach/task-management/internal/models"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, email, passwordHash string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (email, password_hash) VALUES ($1, $2)
		 RETURNING id, email, password_hash, role, created_at, updated_at`,
		email, passwordHash,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return user, nil
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find user by email: %w", err)
	}
	return user, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`SELECT id, email, password_hash, role, created_at, updated_at FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.CreatedAt, &user.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	return user, nil
}
