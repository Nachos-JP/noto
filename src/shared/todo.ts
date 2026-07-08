export const TODO_STATUSES = ["todo", "inProgress", "done"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

export type TodoStatus = (typeof TODO_STATUSES)[number];
export type TodoPriority = (typeof PRIORITIES)[number];
export type ViewMode = "list" | "kanban";

export interface Todo {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface AppState {
  todos: Todo[];
  viewMode: ViewMode;
  searchQuery: string;
  statusFilter: TodoStatus | "all";
  priorityFilter: TodoPriority | "all";
  sortBy: "updatedAt" | "createdAt" | "dueDate" | "priority";
}

export const createEmptyAppState = (): AppState => ({
  todos: [],
  viewMode: "list",
  searchQuery: "",
  statusFilter: "all",
  priorityFilter: "all",
  sortBy: "updatedAt",
});
