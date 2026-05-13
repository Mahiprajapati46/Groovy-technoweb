import fs from 'fs';
import path from 'path';
import { parsePDF } from '../utils/pdfParser.js';

// Store PDF data in memory for demo
let currentPDF = null;

export async function uploadPDF(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse PDF
    const pdfBuffer = req.file.buffer;
    const parseResult = await parsePDF(pdfBuffer);

    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error });
    }

    // Store in memory
    currentPDF = {
      fileName: req.file.originalname,
      uploadedAt: new Date().toISOString(),
      totalPages: parseResult.totalPages,
      pages: parseResult.pages,
      fullText: parseResult.fullText,
      metadata: parseResult.metadata
    };

    res.json({
      success: true,
      message: 'PDF uploaded successfully',
      data: {
        fileName: currentPDF.fileName,
        totalPages: currentPDF.totalPages,
        uploadedAt: currentPDF.uploadedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function getPDFStatus(req, res) {
  if (!currentPDF) {
    return res.json({ 
      status: 'no_pdf', 
      message: 'No PDF currently loaded' 
    });
  }

  res.json({
    status: 'loaded',
    fileName: currentPDF.fileName,
    totalPages: currentPDF.totalPages,
    uploadedAt: currentPDF.uploadedAt,
    pageCount: currentPDF.pages.length
  });
}

export function getCurrentPDF(req, res) {
  if (!currentPDF) {
    return res.status(404).json({ error: 'No PDF loaded' });
  }

  res.json(currentPDF);
}

// Export for use in other modules
export function getStoredPDF() {
  return currentPDF;
}

export function clearStoredPDF() {
  currentPDF = null;
}
