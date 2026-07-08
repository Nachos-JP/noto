# Noto

Noto is a local-first desktop todo app built with Electron, React, and TypeScript.

Todo data is stored as JSON in Electron's `userData` directory. The app does not use a
server, database, account system, sharing, or assignment workflow.

## Commands

- `npm run dev` starts the Electron app in development mode.
- `npm run build` type-checks and builds the app.
- `npm run lint` runs ESLint.
- `npm test` runs unit and component tests.
- `npm run test:e2e` builds the app and runs Playwright Electron tests.
- `npm run package` creates unpacked desktop app directories.
- `npm run dist` builds desktop packages for configured platforms.
