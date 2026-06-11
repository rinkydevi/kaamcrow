package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/naveensiwach/task-management/internal/middleware"
	"github.com/naveensiwach/task-management/internal/models"
	"github.com/naveensiwach/task-management/internal/repository"
)

const maxUploadSize = 10 << 20 // 10 MB

type AttachmentHandler struct {
	attachments *repository.AttachmentRepository
	tasks       *repository.TaskRepository
	uploadsDir  string
}

func NewAttachmentHandler(attachments *repository.AttachmentRepository, tasks *repository.TaskRepository, uploadsDir string) *AttachmentHandler {
	return &AttachmentHandler{attachments: attachments, tasks: tasks, uploadsDir: uploadsDir}
}

func (h *AttachmentHandler) List(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "id")
	task, err := h.tasks.FindByID(r.Context(), taskID)
	if err != nil || task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err := h.checkOwnership(r, task); err != nil {
		writeError(w, http.StatusForbidden, "access denied")
		return
	}

	list, err := h.attachments.ListByTask(r.Context(), taskID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list attachments")
		return
	}
	if list == nil {
		list = []*models.Attachment{}
	}
	writeJSON(w, http.StatusOK, list)
}

func (h *AttachmentHandler) Upload(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "id")
	userID := middleware.UserIDFromCtx(r.Context())

	task, err := h.tasks.FindByID(r.Context(), taskID)
	if err != nil || task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err := h.checkOwnership(r, task); err != nil {
		writeError(w, http.StatusForbidden, "access denied")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeError(w, http.StatusBadRequest, "file too large or invalid form")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "missing file field")
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	storedName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	destPath := filepath.Join(h.uploadsDir, storedName)

	dest, err := os.Create(destPath)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save file")
		return
	}
	defer dest.Close()

	written, err := io.Copy(dest, file)
	if err != nil {
		os.Remove(destPath)
		writeError(w, http.StatusInternalServerError, "failed to write file")
		return
	}

	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	created, err := h.attachments.Create(r.Context(), &models.Attachment{
		TaskID:       taskID,
		UserID:       userID,
		Filename:     storedName,
		OriginalName: header.Filename,
		MimeType:     mimeType,
		Size:         written,
	})
	if err != nil {
		os.Remove(destPath)
		writeError(w, http.StatusInternalServerError, "failed to save attachment record")
		return
	}

	writeJSON(w, http.StatusCreated, created)
}

func (h *AttachmentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	taskID := chi.URLParam(r, "id")
	attachmentID := chi.URLParam(r, "attachmentId")

	task, err := h.tasks.FindByID(r.Context(), taskID)
	if err != nil || task == nil {
		writeError(w, http.StatusNotFound, "task not found")
		return
	}
	if err := h.checkOwnership(r, task); err != nil {
		writeError(w, http.StatusForbidden, "access denied")
		return
	}

	att, err := h.attachments.FindByID(r.Context(), attachmentID)
	if err != nil || att == nil {
		writeError(w, http.StatusNotFound, "attachment not found")
		return
	}

	if err := h.attachments.Delete(r.Context(), attachmentID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete attachment")
		return
	}

	os.Remove(filepath.Join(h.uploadsDir, att.Filename))
	w.WriteHeader(http.StatusNoContent)
}

// ServeFile requires authentication and verifies the requesting user owns the attachment.
func (h *AttachmentHandler) ServeFile(w http.ResponseWriter, r *http.Request) {
	filename := filepath.Base(chi.URLParam(r, "filename"))
	if strings.Contains(filename, "..") || filename == "." {
		writeError(w, http.StatusBadRequest, "invalid filename")
		return
	}

	att, err := h.attachments.FindByFilename(r.Context(), filename)
	if err != nil || att == nil {
		writeError(w, http.StatusNotFound, "file not found")
		return
	}

	userID := middleware.UserIDFromCtx(r.Context())
	role := middleware.RoleFromCtx(r.Context())
	if att.UserID != userID && role != "admin" {
		writeError(w, http.StatusForbidden, "access denied")
		return
	}

	http.ServeFile(w, r, filepath.Join(h.uploadsDir, filename))
}

func (h *AttachmentHandler) checkOwnership(r *http.Request, task *models.Task) error {
	userID := middleware.UserIDFromCtx(r.Context())
	role := middleware.RoleFromCtx(r.Context())
	if task.UserID != userID && role != "admin" {
		return errForbidden
	}
	return nil
}
