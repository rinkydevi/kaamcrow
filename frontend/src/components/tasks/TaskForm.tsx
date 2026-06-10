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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-white">
          {isEditing ? "Edit Task" : "New Task"}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Title"
            id="title"
            placeholder="Task title"
            error={errors.title?.message}
            {...register("title")}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Optional description"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Attachments
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-600"
            >
              <span>+</span> Add file (max 10 MB)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            {pendingFiles.length > 0 && (
              <ul className="space-y-1">
                {pendingFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-xs dark:bg-gray-800">
                    <span className="truncate text-gray-700 dark:text-gray-300">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="ml-2 text-red-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
