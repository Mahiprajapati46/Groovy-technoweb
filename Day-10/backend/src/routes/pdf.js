import express from 'express';
import multer from 'multer';
import { uploadPDF, getPDFStatus, getCurrentPDF } from '../controllers/pdfController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Routes
router.post('/upload', upload.single('pdf'), uploadPDF);
router.get('/status', getPDFStatus);
router.get('/current', getCurrentPDF);

export default router;
