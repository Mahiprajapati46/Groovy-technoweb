# Ask My Notes 📚

Ask My Notes is a professional, AI-powered document assistant that allows you to upload PDFs and engage in a real-time chat to extract insights, summarize content, and find specific information with precise page citations.

## ✨ Features

- **Professional Chat Interface**: Immersive, bubble-style conversation with AI.
- **Precise Citations**: Automatically cites page numbers for every answer provided.
- **Live Telemetry**: Real-time tracking of API usage, token consumption, and estimated costs.
- **Document Memory**: Efficiently handles large PDFs by parsing and indexing content for rapid retrieval.
- **Modern UI**: Clean, elegant, and responsive design built with industry-standard aesthetics.

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Axios, Vanilla CSS
- **Backend**: Node.js, Express
- **AI Intelligence**: Groq API (Llama 3.1 8B Instant)
- **PDF Processing**: pdf-parse

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Groq API Key

### 2. Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd AskMyNotes
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   ```

### 3. Running the Application

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## 📊 Telemetry & Costs
The system tracks usage in real-time. Costs are estimated based on typical Groq API pricing models. You can reset telemetry at any time via the sidebar dashboard.

## 🛡️ License
MIT License. Free to use for personal and commercial projects.
