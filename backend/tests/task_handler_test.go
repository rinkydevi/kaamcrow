package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/naveensiwach/task-management/internal/events"
	"github.com/naveensiwach/task-management/internal/handlers"
	"github.com/naveensiwach/task-management/internal/middleware"
	"github.com/naveensiwach/task-management/internal/models"
	"github.com/naveensiwach/task-management/internal/repository"
)

// ── mocks ────────────────────────────────────────────────────────────────────

type mockTaskRepo struct {
	tasks map[string]*models.Task
}

func newMockTaskRepo() *mockTaskRepo {
	return &mockTaskRepo{tasks: make(map[string]*models.Task)}
}

func (m *mockTaskRepo) Create(_ context.Context, userID string, req *models.CreateTaskRequest) (*models.Task, error) {
	t := &models.Task{
		ID:          "task-1",
		UserID:      userID,
		Title:       req.Title,
		Description: req.Description,
		Status:      req.Status,
		Priority:    req.Priority,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	m.tasks[t.ID] = t
	return t, nil
}

func (m *mockTaskRepo) List(_ context.Context, userID string, p *models.TaskListParams, _ bool) (*models.TaskListResponse, error) {
	var result []*models.Task
	for _, t := range m.tasks {
		if t.UserID == userID {
			result = append(result, t)
		}
	}
	return &models.TaskListResponse{Tasks: result, Total: len(result), Page: 1, Limit: 20, TotalPages: 1}, nil
}

func (m *mockTaskRepo) FindByID(_ context.Context, id string) (*models.Task, error) {
	return m.tasks[id], nil
}

func (m *mockTaskRepo) UpdateOwned(_ context.Context, id, userID string, isAdmin bool, req *models.UpdateTaskRequest) (*models.Task, error) {
	t, ok := m.tasks[id]
	if !ok {
		return nil, repository.ErrNotFound
	}
	if t.UserID != userID && !isAdmin {
		return nil, repository.ErrForbidden
	}
	if req.Title != nil {
		t.Title = *req.Title
	}
	if req.Status != nil {
		t.Status = *req.Status
	}
	return t, nil
}

func (m *mockTaskRepo) DeleteOwned(_ context.Context, id, userID string, isAdmin bool) error {
	t, ok := m.tasks[id]
	if !ok {
		return repository.ErrNotFound
	}
	if t.UserID != userID && !isAdmin {
		return repository.ErrForbidden
	}
	delete(m.tasks, id)
	return nil
}

type mockActivityRepo struct{}

func (m *mockActivityRepo) Log(_ context.Context, _, _ string, _ models.ActivityAction, _, _ interface{}) error {
	return nil
}
func (m *mockActivityRepo) ListByTask(_ context.Context, _ string) ([]*models.ActivityLog, error) {
	return nil, nil
}

// ── helpers ──────────────────────────────────────────────────────────────────

func newHandler() (*handlers.TaskHandler, *mockTaskRepo) {
	repo := newMockTaskRepo()
	broker := events.NewBroker()
	h := handlers.NewTaskHandler(repo, &mockActivityRepo{}, broker)
	return h, repo
}

// injectUser sets the user context the same way the auth middleware does.
func injectUser(r *http.Request, userID, role string) *http.Request {
	ctx := context.WithValue(r.Context(), middleware.ContextKeyUserID, userID)
	ctx = context.WithValue(ctx, middleware.ContextKeyRole, role)
	return r.WithContext(ctx)
}

func chiCtx(r *http.Request, key, val string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, val)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

// ── tests ────────────────────────────────────────────────────────────────────

func TestCreate_Success(t *testing.T) {
	h, _ := newHandler()
	body, _ := json.Marshal(map[string]string{"title": "Write tests"})
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewReader(body))
	req = injectUser(req, "user-1", "user")
	w := httptest.NewRecorder()

	h.Create(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}
	var task models.Task
	if err := json.Unmarshal(w.Body.Bytes(), &task); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if task.Title != "Write tests" {
		t.Errorf("expected title 'Write tests', got %q", task.Title)
	}
}

func TestCreate_MissingTitle(t *testing.T) {
	h, _ := newHandler()
	body, _ := json.Marshal(map[string]string{"title": ""})
	req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewReader(body))
	req = injectUser(req, "user-1", "user")
	w := httptest.NewRecorder()

	h.Create(w, req)

	if w.Code != http.StatusUnprocessableEntity {
		t.Errorf("expected 422, got %d", w.Code)
	}
}

func TestList_OnlyReturnsOwnTasks(t *testing.T) {
	h, repo := newHandler()
	repo.tasks["t1"] = &models.Task{ID: "t1", UserID: "user-1", Title: "mine"}
	repo.tasks["t2"] = &models.Task{ID: "t2", UserID: "user-2", Title: "not mine"}

	req := httptest.NewRequest(http.MethodGet, "/api/tasks", nil)
	req = injectUser(req, "user-1", "user")
	w := httptest.NewRecorder()

	h.List(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp models.TaskListResponse
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.Total != 1 {
		t.Errorf("expected 1 task, got %d", resp.Total)
	}
}

func TestUpdate_Forbidden(t *testing.T) {
	h, repo := newHandler()
	repo.tasks["t1"] = &models.Task{ID: "t1", UserID: "owner", Title: "original"}

	body, _ := json.Marshal(map[string]string{"title": "hacked"})
	req := httptest.NewRequest(http.MethodPatch, "/api/tasks/t1", bytes.NewReader(body))
	req = injectUser(req, "attacker", "user")
	req = chiCtx(req, "id", "t1")
	w := httptest.NewRecorder()

	h.Update(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
	if repo.tasks["t1"].Title != "original" {
		t.Error("task should not have been mutated")
	}
}

func TestUpdate_NotFound(t *testing.T) {
	h, _ := newHandler()
	body, _ := json.Marshal(map[string]string{"title": "new"})
	req := httptest.NewRequest(http.MethodPatch, "/api/tasks/ghost", bytes.NewReader(body))
	req = injectUser(req, "user-1", "user")
	req = chiCtx(req, "id", "ghost")
	w := httptest.NewRecorder()

	h.Update(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", w.Code)
	}
}

func TestDelete_Forbidden(t *testing.T) {
	h, repo := newHandler()
	repo.tasks["t1"] = &models.Task{ID: "t1", UserID: "owner", Title: "keep me"}

	req := httptest.NewRequest(http.MethodDelete, "/api/tasks/t1", nil)
	req = injectUser(req, "attacker", "user")
	req = chiCtx(req, "id", "t1")
	w := httptest.NewRecorder()

	h.Delete(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
	if _, ok := repo.tasks["t1"]; !ok {
		t.Error("task should not have been deleted")
	}
}

func TestDelete_AdminCanDeleteAny(t *testing.T) {
	h, repo := newHandler()
	repo.tasks["t1"] = &models.Task{ID: "t1", UserID: "owner", Title: "deletable"}

	req := httptest.NewRequest(http.MethodDelete, "/api/tasks/t1", nil)
	req = injectUser(req, "admin-user", "admin")
	req = chiCtx(req, "id", "t1")
	w := httptest.NewRecorder()

	h.Delete(w, req)

	if w.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", w.Code)
	}
	if _, ok := repo.tasks["t1"]; ok {
		t.Error("task should have been deleted by admin")
	}
}

func TestGet_Forbidden(t *testing.T) {
	h, repo := newHandler()
	repo.tasks["t1"] = &models.Task{ID: "t1", UserID: "owner"}

	req := httptest.NewRequest(http.MethodGet, "/api/tasks/t1", nil)
	req = injectUser(req, "other", "user")
	req = chiCtx(req, "id", "t1")
	w := httptest.NewRecorder()

	h.Get(w, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}
