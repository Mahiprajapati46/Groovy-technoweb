# Project Instructions: Student Management CRUD

This project is a full-stack student management system using React, Node.js (Express), and PostgreSQL.

## Tech Stack
- **Frontend**: React (Vite), Vanilla CSS.
- **Backend**: Node.js (Express), `pg` (PostgreSQL client).
- **Database**: PostgreSQL (local installation).

## Project Structure
- `backend/`: Express server, database connection, and API endpoints.
  - `src/server.js`: Main entry point and CRUD logic.
  - `src/db.js`: Database pool configuration and initialization.
- `frontend/`: React application.
  - `src/App.jsx`: Main UI component, form handling, and API integration.
  - `src/index.css`: Global styles.

## Coding Conventions

### Backend
- Use ES Modules (`import`/`export`).
- Use `dotenv` for environment variables.
- Always `trim()` string inputs and `toLowerCase()` email addresses before saving.
- Error handling should return appropriate HTTP status codes (400 for bad requests, 404 for not found, 409 for conflicts, 500 for server errors).
- Use parameterized queries to prevent SQL injection.

### Frontend
- Use functional components with hooks (`useState`, `useEffect`, `useMemo`).
- Keep styles in `index.css` using a utility-first or component-based CSS approach.
- Use `fetch` for API calls, pointing to `VITE_API_URL` from `.env`.
- Provide user feedback (success/error messages) for all CRUD operations.

## Local Development Setup

### 1. Database (PostgreSQL)
Ensure you have a local PostgreSQL instance running. 
1. Create a database (e.g., `studentdb`).
2. Update the `backend/.env` file with your local database credentials (host, port, user, password, and database name).

### 2. Backend
```bash
cd backend
copy .env.example .env
# Edit .env with your DB credentials
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

## Validation & Testing
- Use `npm run dev` to start development servers.
- Verify API health at `http://localhost:5000/api/health`.
- Ensure frontend can connect to backend by checking the "Student Records" table on the dashboard.
