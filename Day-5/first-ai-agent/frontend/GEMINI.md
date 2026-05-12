# HR-Pulse Frontend

Autonomous Talent Intelligence Dashboard powered by React and Vite.

## Tech Stack
- **Framework**: React (v19)
- **Build Tool**: Vite (v8)
- **Styling**: Vanilla CSS (modern custom properties)
- **Icons**: SVG-based system

## Project Structure
- `src/App.jsx`: Main dashboard component containing auth logic and resume analysis view.
- `src/main.jsx`: Application entry point.
- `src/App.css`: Global styles and UI theme.
- `public/`: Static assets and icons.

## Features
- **HR Authentication**: Secure login for HR personnel.
- **Candidate List**: View and select candidates from the local database.
- **AI Scorecard**: Real-time resume analysis powered by Groq AI.
- **Interactive Scoring**: Visual breakdown of technical, experience, and relevance scores.
- **Email Automation**: View and edit AI-generated interview invitation drafts.

## Development Workflows

### Setup
1. Install dependencies: `npm install`.
2. Ensure the backend is running (usually on `http://localhost:5001`).

### Running the App
- **Development**: `npm run dev` (Vite dev server)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

## Design Conventions
- **Theming**: Uses CSS variables for colors, spacing, and shadows (defined in `index.css`/`App.css`).
- **Layout**: CSS Grid and Flexbox for responsive dashboard components.
- **Components**: Functional components with hooks (`useState`, `useEffect`, `useCallback`).
- **API Interaction**: Standard `fetch` API for communicating with the backend.
