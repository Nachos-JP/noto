import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import {dirname, join} from "node:path";
import {
  PRIORITIES,
  TODO_STATUSES,
  createEmptyAppState,
  type AppState,
  type Todo,
  type TodoPriority,
  type TodoStatus,
  type ViewMode,
} from "../shared/todo";

const DATA_FILE_NAME = "noto-state.json";

export class TodoStore {
  private readonly filePath: string;

  constructor(userDataPath: string) {
    this.filePath = join(userDataPath, DATA_FILE_NAME);
  }

  async load(): Promise<AppState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return normalizeAppState(JSON.parse(raw));
    } catch (error) {
      if (isMissingFileError(error) || error instanceof SyntaxError) {
        return createEmptyAppState();
      }

      throw error;
    }
  }

  async save(state: AppState): Promise<AppState> {
    const normalized = normalizeAppState(state);
    await mkdir(dirname(this.filePath), {recursive: true});

    const tempPath = `${this.filePath}.tmp`;
    await writeFile(
      tempPath,
      `${JSON.stringify(normalized, null, 2)}\n`,
      "utf8",
    );
    await rename(tempPath, this.filePath);

    return normalized;
  }
}

export const normalizeAppState = (value: unknown): AppState => {
  if (!isRecord(value)) {
    return createEmptyAppState();
  }

  const fallback = createEmptyAppState();

  return {
    todos: Array.isArray(value.todos)
      ? value.todos
          .map(normalizeTodo)
          .filter((todo): todo is Todo => todo !== null)
      : [],
    viewMode: isViewMode(value.viewMode) ? value.viewMode : fallback.viewMode,
    searchQuery:
      typeof value.searchQuery === "string"
        ? value.searchQuery
        : fallback.searchQuery,
    statusFilter:
      value.statusFilter === "all" || isTodoStatus(value.statusFilter)
        ? value.statusFilter
        : fallback.statusFilter,
    priorityFilter:
      value.priorityFilter === "all" || isTodoPriority(value.priorityFilter)
        ? value.priorityFilter
        : fallback.priorityFilter,
    sortBy: isSortBy(value.sortBy) ? value.sortBy : fallback.sortBy,
  };
};

const normalizeTodo = (value: unknown): Todo | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.title !== "string"
  ) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: value.id,
    title: value.title,
    description: typeof value.description === "string" ? value.description : "",
    status: isTodoStatus(value.status) ? value.status : "todo",
    priority: isTodoPriority(value.priority) ? value.priority : "medium",
    dueDate: typeof value.dueDate === "string" ? value.dueDate : null,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
    completedAt:
      typeof value.completedAt === "string" ? value.completedAt : null,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isTodoStatus = (value: unknown): value is TodoStatus =>
  TODO_STATUSES.includes(value as TodoStatus);

const isTodoPriority = (value: unknown): value is TodoPriority =>
  PRIORITIES.includes(value as TodoPriority);

const isViewMode = (value: unknown): value is ViewMode =>
  value === "list" || value === "kanban";

const isSortBy = (value: unknown): value is AppState["sortBy"] =>
  value === "updatedAt" ||
  value === "createdAt" ||
  value === "dueDate" ||
  value === "priority";

const isMissingFileError = (error: unknown): boolean =>
  isRecord(error) && error.code === "ENOENT";
