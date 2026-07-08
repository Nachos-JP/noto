import {nanoid} from "nanoid";
import type {AppState, Todo, TodoPriority, TodoStatus} from "@shared/todo";

export interface TodoDraft {
  title: string;
  description: string;
  priority: TodoPriority;
  dueDate: string;
  tags: string;
}

export interface TodoFilters {
  searchQuery: string;
  statusFilter: AppState["statusFilter"];
  priorityFilter: AppState["priorityFilter"];
  sortBy: AppState["sortBy"];
}

export const createTodo = (
  draft: TodoDraft,
  now = new Date().toISOString(),
  id = nanoid(),
): Todo => ({
  id,
  title: draft.title.trim(),
  description: draft.description.trim(),
  status: "todo",
  priority: draft.priority,
  dueDate: draft.dueDate || null,
  tags: parseTags(draft.tags),
  createdAt: now,
  updatedAt: now,
  completedAt: null,
});

export const updateTodo = (
  todo: Todo,
  updates: Partial<
    Pick<Todo, "title" | "description" | "priority" | "dueDate" | "tags">
  >,
  now = new Date().toISOString(),
): Todo => ({
  ...todo,
  ...updates,
  title: updates.title?.trim() ?? todo.title,
  description: updates.description?.trim() ?? todo.description,
  dueDate: updates.dueDate === "" ? null : (updates.dueDate ?? todo.dueDate),
  updatedAt: now,
});

export const updateTodoStatus = (
  todo: Todo,
  status: TodoStatus,
  now = new Date().toISOString(),
): Todo => ({
  ...todo,
  status,
  updatedAt: now,
  completedAt: status === "done" ? (todo.completedAt ?? now) : null,
});

export const filterAndSortTodos = (
  todos: Todo[],
  filters: TodoFilters,
): Todo[] => {
  const query = filters.searchQuery.trim().toLowerCase();

  return [...todos]
    .filter((todo) => {
      const matchesQuery =
        query.length === 0 ||
        [todo.title, todo.description, ...todo.tags].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesStatus =
        filters.statusFilter === "all" || todo.status === filters.statusFilter;
      const matchesPriority =
        filters.priorityFilter === "all" ||
        todo.priority === filters.priorityFilter;

      return matchesQuery && matchesStatus && matchesPriority;
    })
    .sort((a, b) => compareTodos(a, b, filters.sortBy));
};

export const parseTags = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );

export const formatTags = (tags: string[]): string => tags.join(", ");

export const getTodoStats = (todos: Todo[]): Record<TodoStatus, number> => ({
  todo: todos.filter((todo) => todo.status === "todo").length,
  inProgress: todos.filter((todo) => todo.status === "inProgress").length,
  done: todos.filter((todo) => todo.status === "done").length,
});

const compareTodos = (a: Todo, b: Todo, sortBy: AppState["sortBy"]): number => {
  if (sortBy === "priority") {
    return (
      priorityRank[b.priority] - priorityRank[a.priority] ||
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }

  if (sortBy === "dueDate") {
    return (
      compareNullableDate(a.dueDate, b.dueDate) ||
      b.updatedAt.localeCompare(a.updatedAt)
    );
  }

  return b[sortBy].localeCompare(a[sortBy]);
};

const compareNullableDate = (a: string | null, b: string | null): number => {
  if (a === b) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return a.localeCompare(b);
};

const priorityRank: Record<TodoPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};
