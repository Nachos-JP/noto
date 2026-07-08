import { _electron as electron, expect, test } from '@playwright/test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('creates a task and switches to kanban view', async () => {
  const userDataPath = await mkdtemp(join(tmpdir(), 'noto-e2e-'))
  const app = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      NOTO_USER_DATA_PATH: userDataPath
    }
  })

  try {
    const page = await app.firstWindow()

    await expect(page.getByRole('heading', { name: 'Tasks, kept local.' })).toBeVisible()
    await page.getByPlaceholder('Capture a task').fill('Review local app')
    await page.getByRole('button', { name: /add task/i }).click()

    await expect(page.getByText('Review local app')).toBeVisible()
    await page.getByRole('button', { name: /board/i }).click()
    await expect(page.getByRole('heading', { name: 'Todo' })).toBeVisible()
    await expect(page.getByText('Review local app')).toBeVisible()
  } finally {
    await app.close()
    await rm(userDataPath, { recursive: true, force: true })
  }
})
