package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/naveensiwach/task-management/internal/events"
	"github.com/naveensiwach/task-management/internal/middleware"
	"github.com/naveensiwach/task-management/internal/models"
	"github.com/naveensiwach/task-management/internal/repository"
)

const dbTimeout = 5 * time.Second

// TaskRepo is the subset of TaskRepository methods the handler needs.
// Accepting an interface makes the handler unit-testable without a live DB.
type TaskRepo interface {
	Create(ctx context.Context, userID string, req *models.CreateTaskRequest) (*models.Task, error)
	List(ctx context.Context, userID string, p *models.TaskListParams, adminAll bool) (*models.TaskListResponse, error)
	FindByID(ctx context.Context, id string) (*models.Task, error)
	UpdateOwned(ctx context.Context, id, userID string, isAdmin bool, req *models.UpdateTaskRequest) (*models.Task, error)
	DeleteOwned(ctx context.Context, id, userID string, isAdmin bool) error
}

// ActivityRepo is the subset of ActivityRepository methods the handler needs.
type ActivityRepo interface {
	Log(ctx context.Context, taskID, userID string, action models.ActivityAction, oldVals, newVals interface{}) error
	ListByTask(ctx context.Context, taskID string) ([]*models.ActivityLog, error)
}

type TaskHandler struct {
	tasks    TaskRepo
	activity ActivityRepo
	broker   *events.Broker
	validate *validator.Validate
}

func NewTaskHandler(tasks TaskRepo, activity ActivityRepo, broker *events.Broker) *TaskHandler {
	return &TaskHandler{tasks: tasks, activity: activity, broker: broker, validate: validator.New()}
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), dbTimeout)
	defer cancel()

	userID := middleware.UserIDFromCtx(r.Context())
	task, err := h.tasks.Create(ctx, userID, &req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create task")
		return
	}

	if err := h.activity.Log(r.Context(), task.ID, userID, models.ActionCreated, nil, task); err != nil {
		log.Printf("activity log [create %s]: %v", task.ID, err)
	}
	h.broker.Publish(userID, events.TaskEvent{Type: "created", Task: task})

	writeJSON(w, http.StatusCreated, task)
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	limit, _ := strconv.Atoi(q.Get("limit"))

	params := &models.TaskListParams{
		Status:  q.Get("status"),
		Search:  q.Get("search"),
		SortBy:  q.Get("sort_by"),
		SortDir: q.Get("sort_dir"),
		Page:    page,
		Limit:   limit,
	}

	ctx, cancel := context.WithTimeout(r.Context(), dbTimeout)
	defer cancel()

	userID := middleware.UserIDFromCtx(r.Context())
	role := middleware.RoleFromCtx(r.Context())
	adminAll := role == "admin" && q.Get("all") == "true"

	result, err := h.tasks.List(ctx, userID, params, adminAll)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list tasks")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *TaskHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	ctx, cancel := context.WithTimeout(r.Context(), dbTimeout)
	defer cancel()

	task, err := h.tasks.FindByID(ctx, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch task")
		return
	}
	if task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}

	userID := middleware.UserIDFromCtx(r.Context())
	role := middleware.RoleFromCtx(r.Context())
	if task.UserID != userID && role != "admin" {
		writeError(w, http.StatusForbidden, "access denied")
		return
	}
	writeJSON(w, http.StatusOK, task)
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID := middleware.UserIDFromCtx(r.Context())
	role := middleware.RoleFromCtx(r.Context())

	var req models.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), dbTimeout)
	defer cancel()

	updated, err := h.tasks.UpdateOwned(ctx, id, userID, role == "admin", &req)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "task not found")
			return
		}
		if errors.Is(err, repository.ErrForbidden) {
			writeError(w, http.StatusForbidden, "access denied")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update task")
		return
	}

	if err := h.activity.Log(r.Context(), id, userID, models.ActionUpdated, nil, updated); err != nil {
		log.Printf("activity log [update %s]: %v", id, err)
	}
	h.broker.Publish(updated.UserID, events.TaskEvent{Type: "updated", Task: updated})

	writeJSON(w, http.StatusOK, updated)
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	userID := middleware.UserIDFromCtx(r.Context())
	role := middleware.RoleFromCtx(r.Context())

	ctx, cancel := context.WithTimeout(r.Context(), dbTimeout)
	defer cancel()

	if err := h.tasks.DeleteOwned(ctx, id, userID, role == "admin"); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "task not found")
			return
		}
		if errors.Is(err, repository.ErrForbidden) {
			writeError(w, http.StatusForbidden, "access denied")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to delete task")
		return
	}

	h.broker.Publish(userID, events.TaskEvent{Type: "deleted", TaskID: id})
	w.WriteHeader(http.StatusNoContent)
}

// Events streams task changes to the connected client via Server-Sent Events.
func (h *TaskHandler) Events(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "streaming not supported")
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	userID := middleware.UserIDFromCtx(r.Context())
	ch := h.broker.Subscribe(userID)
	defer h.broker.Unsubscribe(userID, ch)

	fmt.Fprintf(w, "event: ping\ndata: {}\n\n")
	flusher.Flush()

	for {
		select {
		case <-r.Context().Done():
			return
		case event, open := <-ch:
			if !open {
				return
			}
			data, err := json.Marshal(event)
			if err != nil {
				continue
			}
			fmt.Fprintf(w, "event: task\ndata: %s\n\n", data)
			flusher.Flush()
		}
	}
}

func (h *TaskHandler) ListActivity(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	ctx, cancel := context.WithTimeout(r.Context(), dbTimeout)
	defer cancel()

	task, err := h.tasks.FindByID(ctx, id)
	if err != nil || task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}

	userID := middleware.UserIDFromCtx(r.Context())
	role := middleware.RoleFromCtx(r.Context())
	if task.UserID != userID && role != "admin" {
		writeError(w, http.StatusForbidden, "access denied")
		return
	}

	logs, err := h.activity.ListByTask(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch activity")
		return
	}
	if logs == nil {
		logs = []*models.ActivityLog{}
	}
	writeJSON(w, http.StatusOK, logs)
}
