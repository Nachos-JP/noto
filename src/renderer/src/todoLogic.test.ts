import {describe, expect, it} from "vitest";
import type {Todo} from "@shared/todo";
import {
  createTodo,
  filterAndSortTodos,
  formatTags,
  getTodoStats,
  parseTags,
  updateTodo,
  updateTodoStatus,
} from "./todoLogic";

const makeTodo = (overrides: Partial<Todo>): Todo => ({
  id: "todo-1",
  title: "Write spec",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: null,
  tags: [],
  createdAt: "2026-07-08T10:00:00.000Z",
  updatedAt: "2026-07-08T10:00:00.000Z",
  completedAt: null,
  ...overrides,
});

describe("todoLogic", () => {
  it("creates a trimmed todo with parsed tags", () => {
    const todo = createTodo(
      {
        title: "  Build app  ",
        description: "  Local only  ",
        priority: "high",
        dueDate: "2026-07-09",
        tags: "electron, react, electron",
      },
      "2026-07-08T10:00:00.000Z",
      "todo-1",
    );

    expect(todo).toMatchObject({
      id: "todo-1",
      title: "Build app",
      description: "Local only",
      priority: "high",
      dueDate: "2026-07-09",
      tags: ["electron", "react"],
      status: "todo",
    });
  });

  it("updates editable todo fields", () => {
    const updated = updateTodo(
      makeTodo({title: "Old title", dueDate: "2026-07-09"}),
      {title: "  New title ", dueDate: ""},
      "2026-07-08T11:00:00.000Z",
    );

    expect(updated.title).toBe("New title");
    expect(updated.dueDate).toBeNull();
    expect(updated.updatedAt).toBe("2026-07-08T11:00:00.000Z");
  });

  it("sets completion timestamp only for done tasks", () => {
    const done = updateTodoStatus(
      makeTodo({}),
      "done",
      "2026-07-08T12:00:00.000Z",
    );
    const reopened = updateTodoStatus(
      done,
      "inProgress",
      "2026-07-08T13:00:00.000Z",
    );

    expect(done.completedAt).toBe("2026-07-08T12:00:00.000Z");
    expect(reopened.completedAt).toBeNull();
  });

  it("filters by text, status, and priority", () => {
    const todos = [
      makeTodo({
        id: "1",
        title: "Buy parts",
        status: "todo",
        priority: "low",
        tags: ["errand"],
      }),
      makeTodo({
        id: "2",
        title: "Ship release",
        status: "done",
        priority: "high",
        tags: ["work"],
      }),
    ];

    expect(
      filterAndSortTodos(todos, {
        searchQuery: "ship",
        statusFilter: "done",
        priorityFilter: "high",
        sortBy: "updatedAt",
      }).map((todo) => todo.id),
    ).toEqual(["2"]);
  });

  it("sorts due dates with undated tasks last", () => {
    const todos = [
      makeTodo({id: "1", dueDate: null}),
      makeTodo({id: "2", dueDate: "2026-07-12"}),
      makeTodo({id: "3", dueDate: "2026-07-09"}),
    ];

    expect(
      filterAndSortTodos(todos, {
        searchQuery: "",
        statusFilter: "all",
        priorityFilter: "all",
        sortBy: "dueDate",
      }).map((todo) => todo.id),
    ).toEqual(["3", "2", "1"]);
  });

  it("counts task statuses and formats tags", () => {
    expect(parseTags("alpha, beta,,alpha")).toEqual(["alpha", "beta"]);
    expect(formatTags(["alpha", "beta"])).toBe("alpha, beta");
    expect(
      getTodoStats([
        makeTodo({id: "1", status: "todo"}),
        makeTodo({id: "2", status: "inProgress"}),
        makeTodo({id: "3", status: "done"}),
      ]),
    ).toEqual({todo: 1, inProgress: 1, done: 1});
  });
});
