# Project Instructions: Professional To-Do App

## Architecture
- **Monorepo Structure**: `client/` (Frontend) and `server/` (Backend).
- **Communication**: Frontend communicates with Backend via REST API.

## Styling Guidelines
- **Vanilla CSS ONLY**: Do not use Tailwind, Bootstrap, or any CSS-in-JS libraries.
- **Design Tokens**: Use CSS variables in `client/src/styles/variables.css`.
- **Naming**: Use BEM (Block Element Modifier) or simple semantic class names.
- **Professional Aesthetic**: Focus on clean whitespace, subtle shadows, and a deep navy/blue palette.

## Tech Stack
- **Frontend**: React (Vite) + TypeScript.
- **Backend**: Node.js (Express) + TypeScript.
- **Database**: MongoDB (Mongoose).

## Development Workflow
- Always use TypeScript for both frontend and backend.
- Ensure all API responses follow a consistent JSON format: `{ data: ... }` or `{ error: ... }`.
- Document new endpoints or complex logic in code comments.
- **IMPORTANT: Import Type Syntax**: Since `verbatimModuleSyntax` is enabled in `tsconfig.json`, you **MUST** use `import type` for interfaces and types (e.g., `import type { Todo } from './types'`). Using standard `import` for types will cause a `SyntaxError` in the browser because they are not runtime values.
