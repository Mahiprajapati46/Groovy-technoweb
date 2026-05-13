import express from 'express';
import { queryPDF, getCosts, resetCosts } from '../controllers/queryController.js';

const router = express.Router();

router.post('/ask', queryPDF);
router.get('/costs', getCosts);
router.post('/costs/reset', resetCosts);

export default router;
