package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/naveensiwach/task-management/internal/events"
	"github.com/naveensiwach/task-management/internal/middleware"
	"github.com/naveensiwach/task-management/internal/models"
	"github.com/naveensiwach/task-management/internal/repository"
)

type TaskHandler struct {
	tasks    *repository.TaskRepository
	activity *repository.ActivityRepository
	broker   *events.Broker
	validate *validator.Validate
}

func NewTaskHandler(tasks *repository.TaskRepository, activity *repository.ActivityRepository, broker *events.Broker) *TaskHandler {
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

	userID := middleware.UserIDFromCtx(r.Context())
	task, err := h.tasks.Create(r.Context(), userID, &req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create task")
		return
	}

	h.activity.Log(r.Context(), task.ID, userID, models.ActionCreated, nil, task)
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

	userID := middleware.UserIDFromCtx(r.Context())
	role := middleware.RoleFromCtx(r.Context())
	adminAll := role == "admin" && q.Get("all") == "true"

	result, err := h.tasks.List(r.Context(), userID, params, adminAll)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list tasks")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *TaskHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	task, err := h.tasks.FindByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch task")
		return
	}
	if task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err := h.checkOwnership(r, task); err != nil {
		writeError(w, http.StatusForbidden, "access denied")
		return
	}
	writeJSON(w, http.StatusOK, task)
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	task, err := h.tasks.FindByID(r.Context(), id)
	if err != nil || task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err := h.checkOwnership(r, task); err != nil {
		writeError(w, http.StatusForbidden, "access denied")
		return
	}

	oldTask := *task

	var req models.UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if err := h.validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	updated, err := h.tasks.Update(r.Context(), id, &req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update task")
		return
	}

	userID := middleware.UserIDFromCtx(r.Context())
	h.activity.Log(r.Context(), id, userID, models.ActionUpdated, &oldTask, updated)
	h.broker.Publish(task.UserID, events.TaskEvent{Type: "updated", Task: updated})

	writeJSON(w, http.StatusOK, updated)
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	task, err := h.tasks.FindByID(r.Context(), id)
	if err != nil || task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err := h.checkOwnership(r, task); err != nil {
		writeError(w, http.StatusForbidden, "access denied")
		return
	}

	if err := h.tasks.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete task")
		return
	}

	h.broker.Publish(task.UserID, events.TaskEvent{Type: "deleted", TaskID: id})
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
	task, err := h.tasks.FindByID(r.Context(), id)
	if err != nil || task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err := h.checkOwnership(r, task); err != nil {
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

func (h *TaskHandler) checkOwnership(r *http.Request, task *models.Task) error {
	userID := middleware.UserIDFromCtx(r.Context())
	role := middleware.RoleFromCtx(r.Context())
	if task.UserID != userID && role != "admin" {
		return errForbidden
	}
	return nil
}

var errForbidden = &forbiddenError{}

type forbiddenError struct{}

func (e *forbiddenError) Error() string { return "forbidden" }
