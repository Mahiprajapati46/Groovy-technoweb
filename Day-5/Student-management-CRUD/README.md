# Student Management CRUD (MERN + PostgreSQL)

A professional full-stack Student Management system with elegant UI:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL

## 1) Prerequisites

- Node.js (already available on your machine)
- PostgreSQL (installed locally)

## 2) Start PostgreSQL

Ensure you have PostgreSQL installed and running on your machine. Create a database named `studentdb` (or whatever you prefer, then update `.env`).

The default connection details used by the backend are:
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `your_password`
- Database: `studentdb`

## 3) Backend setup

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.

## 4) Frontend setup

Open a new terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API Endpoints

- `GET /api/health`
- `GET /api/students`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`

## Project Structure

- `backend/src/server.js` - Express server and CRUD endpoints
- `backend/src/db.js` - PostgreSQL connection and table initialization
- `frontend/src/App.jsx` - UI, form, table, and CRUD calls
- `frontend/src/index.css` - Professional elegant styling system

## Notes

- Database table auto-creates when backend starts.
- If Docker is not installed, install Docker Desktop and rerun `docker compose up -d`.
