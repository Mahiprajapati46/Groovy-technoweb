# HR-Pulse Backend

High-fidelity talent acquisition agent backend powered by Groq AI and MongoDB.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js (v5.x)
- **Database**: MongoDB (via Mongoose)
- **AI Engine**: Groq SDK (`llama-3.1-8b-instant`)
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt hashing
- **File Handling**: Multer (for uploads)
- **PDF Parsing**: pdf-parse

## Project Structure
- `server.js`: Main entry point and core API logic (includes MongoDB routes and AI analysis).
- `models/`: Mongoose schemas for `HrUser`, `Job`, and `Application`.
- `routes/`: Express routers (e.g., `auth.js`).
- `middleware/`: Custom middleware (e.g., `requireHr` for protected routes).
- `scripts/`: Database seeding and utility scripts.
- `uploads/`: Temporary storage for uploaded resumes.

## API Endpoints

### Auth
- `POST /api/auth/login`: Login with email and password.
- `GET /api/auth/me`: Get current HR user info (requires token).

### Jobs
- `GET /api/jobs`: List all active jobs.

### Applications
- `GET /api/applications`: List all applications.
- `GET /api/applications/:id`: Get detailed application info.
- `POST /api/applications`: Submit a resume via text.
- `POST /api/applications/upload`: Submit a resume via PDF/TXT file upload (Multipart).
- `PATCH /api/applications/:id/email-draft`: Update the AI-generated email draft.
- `POST /api/applications/:id/send`: Mark email as sent (Mock).

## Development Workflows

### Setup
1. Copy `.env.example` to `.env`.
2. Configure `MONGODB_URI`, `GROQ_API_KEY`, and `JWT_SECRET`.
3. Install dependencies: `npm install`.

### Seeding
Initialize the database with a default HR user and demo jobs:
```bash
npm run seed
```
- **Default Email**: `hr@hrpulse.local`
- **Default Password**: `hrpulse123`

### Running the Server
- **Development**: `npm run dev` (uses nodemon)
- **Production**: `npm start`

## Core Conventions
- **CommonJS**: Use `require` for module imports.
- **Async/Await**: Always use async/await for DB and AI operations.
- **Error Handling**: Use try/catch blocks in routes and return consistent JSON error objects.
- **Security**: Protect sensitive routes with `requireHr` middleware.
