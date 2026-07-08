import {
  Check,
  CheckCircle2,
  Circle,
  Columns3,
  Flag,
  ListTodo,
  Plus,
  Search,
  Trash2
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactElement } from 'react'
import { createEmptyAppState, TODO_STATUSES, type AppState, type Todo, type TodoStatus } from '@shared/todo'
import {
  createTodo,
  filterAndSortTodos,
  formatTags,
  getTodoStats,
  parseTags,
  updateTodo,
  updateTodoStatus,
  type TodoDraft
} from './todoLogic'

const emptyDraft: TodoDraft = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  tags: ''
}

const statusLabels: Record<TodoStatus, string> = {
  todo: 'Todo',
  inProgress: 'In Progress',
  done: 'Done'
}

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High'
} as const

export function App(): ReactElement {
  const [state, setState] = useState<AppState>(createEmptyAppState)
  const [draft, setDraft] = useState<TodoDraft>(emptyDraft)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    window.noto
      .loadState()
      .then((loadedState) => {
        if (isMounted) {
          setState(loadedState)
          setIsLoaded(true)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Could not load local data.')
          setIsLoaded(true)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const updateState = useCallback((updater: (current: AppState) => AppState) => {
    setState((current) => {
      const next = updater(current)
      window.noto.saveState(next).catch(() => {
        setError('Could not save local data.')
      })
      return next
    })
  }, [])

  const filteredTodos = useMemo(
    () =>
      filterAndSortTodos(state.todos, {
        searchQuery: state.searchQuery,
        statusFilter: state.statusFilter,
        priorityFilter: state.priorityFilter,
        sortBy: state.sortBy
      }),
    [state]
  )

  const stats = useMemo(() => getTodoStats(state.todos), [state.todos])
  const selectedTodo = state.todos.find((todo) => todo.id === selectedId) ?? null

  const createTask = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()

    if (draft.title.trim().length === 0) {
      return
    }

    const todo = createTodo(draft)
    updateState((current) => ({ ...current, todos: [todo, ...current.todos] }))
    setDraft(emptyDraft)
    setSelectedId(todo.id)
  }

  const patchTodo = (id: string, patch: (todo: Todo) => Todo): void => {
    updateState((current) => ({
      ...current,
      todos: current.todos.map((todo) => (todo.id === id ? patch(todo) : todo))
    }))
  }

  const changeStatus = (id: string, status: TodoStatus): void => {
    patchTodo(id, (todo) => updateTodoStatus(todo, status))
  }

  const deleteTodo = (id: string): void => {
    updateState((current) => ({
      ...current,
      todos: current.todos.filter((todo) => todo.id !== id)
    }))

    if (selectedId === id) {
      setSelectedId(null)
    }
  }

  const setStateField = <K extends keyof AppState>(key: K, value: AppState[K]): void => {
    updateState((current) => ({ ...current, [key]: value }))
  }

  const handleDrop = (status: TodoStatus): void => {
    if (draggedId) {
      changeStatus(draggedId, status)
      setDraggedId(null)
    }
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Noto</p>
          <h1>Tasks, kept local.</h1>
        </div>
        <div className="view-toggle" aria-label="View mode">
          <button
            className={state.viewMode === 'list' ? 'is-active' : ''}
            type="button"
            onClick={() => setStateField('viewMode', 'list')}
            title="List view"
          >
            <ListTodo size={18} />
            List
          </button>
          <button
            className={state.viewMode === 'kanban' ? 'is-active' : ''}
            type="button"
            onClick={() => setStateField('viewMode', 'kanban')}
            title="Kanban view"
          >
            <Columns3 size={18} />
            Board
          </button>
        </div>
      </header>

      {error && <p className="app-alert">{error}</p>}

      <section className="dashboard">
        <aside className="task-composer" aria-label="Create todo">
          <form onSubmit={createTask}>
            <label>
              Task
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="Capture a task"
              />
            </label>
            <label>
              Notes
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Optional details"
              />
            </label>
            <div className="form-grid">
              <label>
                Priority
                <select
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priority: event.target.value as TodoDraft['priority']
                    }))
                  }
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Due
                <input
                  value={draft.dueDate}
                  onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))}
                  type="date"
                />
              </label>
            </div>
            <label>
              Tags
              <input
                value={draft.tags}
                onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                placeholder="design, home"
              />
            </label>
            <button className="primary-action" type="submit" disabled={!isLoaded || draft.title.trim().length === 0}>
              <Plus size={18} />
              Add task
            </button>
          </form>

          <div className="stats-grid" aria-label="Task stats">
            {TODO_STATUSES.map((status) => (
              <div key={status}>
                <span>{statusLabels[status]}</span>
                <strong>{stats[status]}</strong>
              </div>
            ))}
          </div>
        </aside>

        <section className="workspace" aria-label="Todos">
          <div className="toolbar">
            <label className="search-box">
              <Search size={18} />
              <input
                value={state.searchQuery}
                onChange={(event) => setStateField('searchQuery', event.target.value)}
                placeholder="Search title, note, or tag"
              />
            </label>
            <select
              value={state.statusFilter}
              onChange={(event) => setStateField('statusFilter', event.target.value as AppState['statusFilter'])}
              aria-label="Status filter"
            >
              <option value="all">All statuses</option>
              {TODO_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <select
              value={state.priorityFilter}
              onChange={(event) =>
                setStateField('priorityFilter', event.target.value as AppState['priorityFilter'])
              }
              aria-label="Priority filter"
            >
              <option value="all">All priorities</option>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={state.sortBy}
              onChange={(event) => setStateField('sortBy', event.target.value as AppState['sortBy'])}
              aria-label="Sort todos"
            >
              <option value="updatedAt">Recently updated</option>
              <option value="createdAt">Recently created</option>
              <option value="dueDate">Due date</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          {state.viewMode === 'list' ? (
            <TodoList
              todos={filteredTodos}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onStatusChange={changeStatus}
              onDelete={deleteTodo}
              onDragStart={setDraggedId}
            />
          ) : (
            <KanbanBoard
              todos={filteredTodos}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onStatusChange={changeStatus}
              onDelete={deleteTodo}
              onDragStart={setDraggedId}
              onDrop={handleDrop}
            />
          )}
        </section>

        <aside className="detail-panel" aria-label="Task details">
          {selectedTodo ? (
            <>
              <div className="panel-heading">
                <h2>Details</h2>
                <button type="button" onClick={() => deleteTodo(selectedTodo.id)} title="Delete task">
                  <Trash2 size={18} />
                </button>
              </div>
              <label>
                Title
                <input
                  value={selectedTodo.title}
                  onChange={(event) =>
                    patchTodo(selectedTodo.id, (todo) => updateTodo(todo, { title: event.target.value }))
                  }
                />
              </label>
              <label>
                Notes
                <textarea
                  value={selectedTodo.description}
                  onChange={(event) =>
                    patchTodo(selectedTodo.id, (todo) => updateTodo(todo, { description: event.target.value }))
                  }
                />
              </label>
              <div className="form-grid">
                <label>
                  Status
                  <select
                    value={selectedTodo.status}
                    onChange={(event) => changeStatus(selectedTodo.id, event.target.value as TodoStatus)}
                  >
                    {TODO_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select
                    value={selectedTodo.priority}
                    onChange={(event) =>
                      patchTodo(selectedTodo.id, (todo) =>
                        updateTodo(todo, { priority: event.target.value as TodoDraft['priority'] })
                      )
                    }
                  >
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Due date
                <input
                  type="date"
                  value={selectedTodo.dueDate ?? ''}
                  onChange={(event) =>
                    patchTodo(selectedTodo.id, (todo) => updateTodo(todo, { dueDate: event.target.value }))
                  }
                />
              </label>
              <label>
                Tags
                <input
                  value={formatTags(selectedTodo.tags)}
                  onChange={(event) =>
                    patchTodo(selectedTodo.id, (todo) => updateTodo(todo, { tags: parseTags(event.target.value) }))
                  }
                />
              </label>
            </>
          ) : (
            <div className="empty-detail">
              <CheckCircle2 size={28} />
              <h2>No task selected</h2>
              <p>Select a task to edit details, move status, or remove it.</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  )
}

interface TodoViewProps {
  todos: Todo[]
  selectedId: string | null
  onSelect: (id: string) => void
  onStatusChange: (id: string, status: TodoStatus) => void
  onDelete: (id: string) => void
  onDragStart: (id: string) => void
}

type TodoCardActions = Omit<TodoViewProps, 'todos'>

function TodoList(props: TodoViewProps): ReactElement {
  if (props.todos.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="todo-list">
      {props.todos.map((todo) => (
        <TodoCard key={todo.id} todo={todo} {...props} />
      ))}
    </div>
  )
}

interface KanbanBoardProps extends TodoViewProps {
  onDrop: (status: TodoStatus) => void
}

function KanbanBoard({ todos, onDrop, ...cardProps }: KanbanBoardProps): ReactElement {
  return (
    <div className="kanban-board">
      {TODO_STATUSES.map((status) => {
        const columnTodos = todos.filter((todo) => todo.status === status)

        return (
          <section
            className="kanban-column"
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDrop(status)}
          >
            <header>
              <h2>{statusLabels[status]}</h2>
              <span>{columnTodos.length}</span>
            </header>
            <div className="kanban-stack">
              {columnTodos.length === 0 ? (
                <p className="column-empty">Drop tasks here</p>
              ) : (
                columnTodos.map((todo) => <TodoCard key={todo.id} todo={todo} {...cardProps} />)
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

interface TodoCardProps extends TodoCardActions {
  todo: Todo
}

function TodoCard({
  todo,
  selectedId,
  onSelect,
  onStatusChange,
  onDelete,
  onDragStart
}: TodoCardProps): ReactElement {
  return (
    <article
      className={`todo-card ${selectedId === todo.id ? 'is-selected' : ''}`}
      draggable
      onDragStart={() => onDragStart(todo.id)}
      onClick={() => onSelect(todo.id)}
    >
      <div className="card-main">
        <button
          className="status-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onStatusChange(todo.id, todo.status === 'done' ? 'todo' : 'done')
          }}
          title={todo.status === 'done' ? 'Reopen task' : 'Complete task'}
        >
          {todo.status === 'done' ? <Check size={18} /> : <Circle size={18} />}
        </button>
        <div>
          <h3>{todo.title}</h3>
          {todo.description && <p>{todo.description}</p>}
        </div>
      </div>
      <div className="card-meta">
        <span className={`priority priority-${todo.priority}`}>
          <Flag size={14} />
          {priorityLabels[todo.priority]}
        </span>
        {todo.dueDate && <span>Due {todo.dueDate}</span>}
        {todo.tags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
      <div className="card-actions">
        {TODO_STATUSES.filter((status) => status !== todo.status).map((status) => (
          <button
            key={status}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onStatusChange(todo.id, status)
            }}
          >
            {statusLabels[status]}
          </button>
        ))}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(todo.id)
          }}
          title="Delete task"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  )
}

function EmptyState(): ReactElement {
  return (
    <div className="empty-state">
      <ListTodo size={30} />
      <h2>No tasks found</h2>
      <p>Create a task or adjust the current filters.</p>
    </div>
  )
}
