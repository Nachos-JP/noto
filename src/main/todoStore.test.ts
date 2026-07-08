/* @vitest-environment node */
import {mkdtemp, readFile, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {describe, expect, it} from "vitest";
import {createEmptyAppState, type AppState} from "../shared/todo";
import {normalizeAppState, TodoStore} from "./todoStore";

const createState = (): AppState => ({
  ...createEmptyAppState(),
  todos: [
    {
      id: "todo-1",
      title: "Plan local persistence",
      description: "Store data without a backend.",
      status: "inProgress",
      priority: "high",
      dueDate: "2026-07-09",
      tags: ["electron", "local"],
      createdAt: "2026-07-08T10:00:00.000Z",
      updatedAt: "2026-07-08T10:15:00.000Z",
      completedAt: null,
    },
  ],
  viewMode: "kanban",
  searchQuery: "local",
  statusFilter: "inProgress",
  priorityFilter: "high",
  sortBy: "priority",
});

describe("TodoStore", () => {
  it("returns an empty state when the data file does not exist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "noto-store-"));
    const store = new TodoStore(dir);

    await expect(store.load()).resolves.toEqual(createEmptyAppState());
  });

  it("saves and loads app state as JSON", async () => {
    const dir = await mkdtemp(join(tmpdir(), "noto-store-"));
    const store = new TodoStore(dir);
    const state = createState();

    await store.save(state);

    await expect(store.load()).resolves.toEqual(state);
  });

  it("falls back to an empty state when JSON is corrupt", async () => {
    const dir = await mkdtemp(join(tmpdir(), "noto-store-"));
    await writeFile(join(dir, "noto-state.json"), "{not json", "utf8");

    await expect(new TodoStore(dir).load()).resolves.toEqual(
      createEmptyAppState(),
    );
  });

  it("normalizes incomplete values before saving", async () => {
    const normalized = normalizeAppState({
      todos: [{id: "todo-1", title: "Keep valid task", priority: "urgent"}],
      viewMode: "grid",
      statusFilter: "blocked",
    });

    expect(normalized.todos).toHaveLength(1);
    expect(normalized.todos[0]).toMatchObject({
      id: "todo-1",
      title: "Keep valid task",
      priority: "medium",
      status: "todo",
    });
    expect(normalized.viewMode).toBe("list");
    expect(normalized.statusFilter).toBe("all");
  });

  it("writes formatted JSON to the user data directory", async () => {
    const dir = await mkdtemp(join(tmpdir(), "noto-store-"));
    const store = new TodoStore(dir);

    await store.save(createState());

    const raw = await readFile(join(dir, "noto-state.json"), "utf8");
    expect(raw).toContain('\n  "todos": [');
  });
});
