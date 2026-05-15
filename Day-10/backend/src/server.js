import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();
# testing AI code review bot
import express from 'express';
import cors from 'cors';
import pdfRoutes from './routes/pdf.js';
import queryRoutes from './routes/query.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Professional Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.use('/api/pdf', pdfRoutes);
app.use('/api/query', queryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 ASK MY NOTES - BACKEND ACTIVE`);
  console.log('='.repeat(50));
  console.log(`📡 Status:    Online`);
  console.log(`🌐 URL:       http://localhost:${PORT}`);
  console.log(`🛠️ Mode:      Development`);
  console.log('-'.repeat(50));
  console.log(`📂 Upload:    POST /api/pdf/upload`);
  console.log(`🔍 Query:     POST /api/query/ask`);
  console.log(`📊 Costs:     GET  /api/query/costs`);
  console.log('='.repeat(50) + '\n');
});
