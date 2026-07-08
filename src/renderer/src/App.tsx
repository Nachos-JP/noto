import { CheckCircle2, Columns3, ListTodo } from 'lucide-react'
import type React from 'react'

export function App(): React.ReactElement {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Noto</p>
          <h1>Local-first todo command center</h1>
          <p className="lede">A focused desktop workspace for personal tasks.</p>
        </div>
        <div className="status-pill">
          <CheckCircle2 size={18} />
          Ready
        </div>
      </section>

      <section className="placeholder-grid" aria-label="Initial app capabilities">
        <div>
          <ListTodo size={22} />
          <h2>List</h2>
          <p>Plan, search, filter, and complete work from a dense list view.</p>
        </div>
        <div>
          <Columns3 size={22} />
          <h2>Kanban</h2>
          <p>Move tasks across Todo, In Progress, and Done without leaving the app.</p>
        </div>
      </section>
    </main>
  )
}
