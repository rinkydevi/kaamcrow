import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TaskCard } from "@/components/tasks/TaskCard";
import type { Task } from "@/types";

const mockTask: Task = {
  id: "1",
  user_id: "u1",
  title: "Test task",
  description: "A description",
  status: "todo",
  priority: "medium",
  due_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

vi.mock("@/hooks/useTasks", () => ({
  useUpdateTask: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTask: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useAttachments", () => ({
  useAttachments: () => ({ data: [] }),
  useDeleteAttachment: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useActivity", () => ({
  useActivity: () => ({ data: [], isLoading: false }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("TaskCard", () => {
  it("renders the task title", () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper });
    expect(screen.getByText("Test task")).toBeDefined();
  });

  it("calls onEdit when Edit is clicked", async () => {
    const onEdit = vi.fn();
    render(<TaskCard task={mockTask} onEdit={onEdit} />, { wrapper });
    await userEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });

  it("renders the priority label", () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper });
    // PRIORITY_LABEL maps medium → "Med"
    expect(screen.getByText("Med")).toBeDefined();
  });

  it("renders a checkbox for the task", () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper });
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDefined();
    expect((checkbox as HTMLInputElement).checked).toBe(false);
  });

  it("shows strikethrough title for done tasks", () => {
    const doneTask: Task = { ...mockTask, status: "done" };
    render(<TaskCard task={doneTask} onEdit={vi.fn()} />, { wrapper });
    const title = screen.getByText("Test task");
    expect(title.className).toContain("line-through");
  });
});
