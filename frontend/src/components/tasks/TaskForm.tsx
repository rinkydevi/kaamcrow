"use client";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Task } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import { useUploadAttachment } from "@/hooks/useAttachments";
import { CrowLogo } from "@/components/ui/CrowLogo";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  task?: Task | null;
  onClose: () => void;
}


export function TaskForm({ task, onClose }: Props) {
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const uploadAttachment = useUploadAttachment();
  const isEditing = !!task;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: "",
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
      });
    }
  }, [task, reset]);

  const uploadFiles = async (taskId: string) => {
    await Promise.all(
      pendingFiles.map((file) => uploadAttachment.mutateAsync({ taskId, file }))
    );
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
    };

    if (isEditing) {
      await updateTask.mutateAsync({ id: task.id, payload });
      if (pendingFiles.length) await uploadFiles(task.id);
    } else {
      const created = await createTask.mutateAsync(payload);
      if (pendingFiles.length) await uploadFiles(created.id);
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeFile = (idx: number) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));

  const isPending =
    createTask.isPending || updateTask.isPending || uploadAttachment.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(7, 7, 15, 0.85)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "Edit task" : "New task"}
    >
      <div className="glass-card modal-gradient-border relative w-full max-w-lg rounded-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-crow-border/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crow-border flex-shrink-0">
            <CrowLogo className="h-6 w-6 text-crow-text" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-crow-text">
              {isEditing ? "Edit Task" : "New Task"}
            </h2>
            <p className="text-xs text-crow-muted">
              {isEditing ? "Update the task details below." : "What needs to be done?"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-crow-muted hover:text-crow-text hover:bg-crow-border/60 transition-all duration-200 flex-shrink-0"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-6 py-5">
          <Input
            label="Title"
            id="title"
            placeholder="What needs to be done?"
            error={errors.title?.message}
            {...register("title")}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-crow-muted">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Optional details…"
              className="crow-textarea"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Status" id="status" {...register("status")}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </Select>

            <Select label="Priority" id="priority" {...register("priority")}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>

          <Input label="Due Date" id="due_date" type="date" {...register("due_date")} />

          {/* File attachments */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-crow-muted">
              Attachments
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-crow-border hover:border-crow-feather/50 px-3 py-2.5 text-sm text-crow-muted hover:text-crow-feather hover:bg-crow-feather/5 transition-all duration-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Add file (max 10 MB)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            {pendingFiles.length > 0 && (
              <ul className="space-y-1.5">
                {pendingFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-crow-shadow/60 border border-crow-border/40 px-3 py-1.5 text-xs">
                    <span className="truncate text-crow-text">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="ml-2 text-crow-muted hover:text-red-400 transition-colors"
                      aria-label={`Remove ${f.name}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1 border-t border-crow-border/30 mt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isEditing ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
