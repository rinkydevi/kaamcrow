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

  it("renders status and priority badges", () => {
    render(<TaskCard task={mockTask} onEdit={vi.fn()} />, { wrapper });
    expect(screen.getByText("To Do")).toBeDefined();
    expect(screen.getByText("Medium")).toBeDefined();
  });
});
