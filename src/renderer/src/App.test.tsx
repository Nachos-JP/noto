import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyAppState, type AppState } from '@shared/todo'
import { App } from './App'

const createState = (overrides: Partial<AppState> = {}): AppState => ({
  ...createEmptyAppState(),
  ...overrides
})

const installApiMock = (state: AppState = createEmptyAppState()) => {
  const api = {
    loadState: vi.fn().mockResolvedValue(state),
    saveState: vi.fn().mockImplementation((nextState: AppState) => Promise.resolve(nextState))
  }

  Object.defineProperty(window, 'noto', {
    value: api,
    configurable: true
  })

  return api
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a task and persists the next state', async () => {
    const api = installApiMock()
    const user = userEvent.setup()

    render(<App />)

    await user.type(await screen.findByPlaceholderText('Capture a task'), 'Write component tests')
    await user.click(screen.getByRole('button', { name: /add task/i }))

    expect(await screen.findByText('Write component tests')).toBeInTheDocument()
    await waitFor(() => expect(api.saveState).toHaveBeenCalled())
  })

  it('filters visible tasks by search text', async () => {
    installApiMock(
      createState({
        todos: [
          {
            id: 'todo-1',
            title: 'Buy coffee',
            description: '',
            status: 'todo',
            priority: 'low',
            dueDate: null,
            tags: ['home'],
            createdAt: '2026-07-08T10:00:00.000Z',
            updatedAt: '2026-07-08T10:00:00.000Z',
            completedAt: null
          },
          {
            id: 'todo-2',
            title: 'Ship release',
            description: 'Prepare notes',
            status: 'inProgress',
            priority: 'high',
            dueDate: null,
            tags: ['work'],
            createdAt: '2026-07-08T11:00:00.000Z',
            updatedAt: '2026-07-08T11:00:00.000Z',
            completedAt: null
          }
        ]
      })
    )
    const user = userEvent.setup()

    render(<App />)

    expect(await screen.findByText('Ship release')).toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Search title, note, or tag'), 'coffee')

    expect(screen.getByText('Buy coffee')).toBeInTheDocument()
    expect(screen.queryByText('Ship release')).not.toBeInTheDocument()
  })

  it('switches to the kanban board and moves a task', async () => {
    const api = installApiMock(
      createState({
        todos: [
          {
            id: 'todo-1',
            title: 'Draft roadmap',
            description: '',
            status: 'todo',
            priority: 'medium',
            dueDate: null,
            tags: [],
            createdAt: '2026-07-08T10:00:00.000Z',
            updatedAt: '2026-07-08T10:00:00.000Z',
            completedAt: null
          }
        ]
      })
    )
    const user = userEvent.setup()

    render(<App />)

    await user.click(await screen.findByRole('button', { name: /board/i }))
    const task = screen.getByText('Draft roadmap').closest('article')
    expect(task).not.toBeNull()

    await user.click(within(task as HTMLElement).getByRole('button', { name: 'In Progress' }))

    await waitFor(() => {
      const latestState = api.saveState.mock.calls.at(-1)?.[0] as AppState
      expect(latestState.todos[0].status).toBe('inProgress')
    })
  })
})
