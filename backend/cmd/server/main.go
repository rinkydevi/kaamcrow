package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/naveensiwach/task-management/internal/config"
	"github.com/naveensiwach/task-management/internal/db"
	"github.com/naveensiwach/task-management/internal/events"
	"github.com/naveensiwach/task-management/internal/handlers"
	"github.com/naveensiwach/task-management/internal/middleware"
	"github.com/naveensiwach/task-management/internal/repository"
)

func main() {
	cfg := config.Load()

	if err := os.MkdirAll(cfg.UploadsDir, 0755); err != nil {
		log.Fatalf("failed to create uploads dir: %v", err)
	}

	pool, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	userRepo := repository.NewUserRepository(pool)
	taskRepo := repository.NewTaskRepository(pool)
	activityRepo := repository.NewActivityRepository(pool)
	attachmentRepo := repository.NewAttachmentRepository(pool)

	broker := events.NewBroker()

	authHandler := handlers.NewAuthHandler(userRepo, cfg.JWTSecret)
	taskHandler := handlers.NewTaskHandler(taskRepo, activityRepo, broker)
	attachmentHandler := handlers.NewAttachmentHandler(attachmentRepo, taskRepo, cfg.UploadsDir)

	r := chi.NewRouter()
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.RequestID)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{cfg.AllowedOrigin},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Route("/api", func(r chi.Router) {
		r.Post("/signup", authHandler.Signup)
		r.Post("/login", authHandler.Login)

		// Public file serving — filenames are UUIDs so effectively unguessable
		r.Get("/uploads/{filename}", attachmentHandler.ServeFile)

		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticate(cfg.JWTSecret))

			r.Route("/tasks", func(r chi.Router) {
				r.Post("/", taskHandler.Create)
				r.Get("/", taskHandler.List)
				r.Get("/events", taskHandler.Events)
				r.Get("/{id}", taskHandler.Get)
				r.Patch("/{id}", taskHandler.Update)
				r.Delete("/{id}", taskHandler.Delete)
				r.Get("/{id}/activity", taskHandler.ListActivity)
				r.Get("/{id}/attachments", attachmentHandler.List)
				r.Post("/{id}/attachments", attachmentHandler.Upload)
				r.Delete("/{id}/attachments/{attachmentId}", attachmentHandler.Delete)
			})
		})
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("server listening on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
