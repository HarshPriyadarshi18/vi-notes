import express from 'express';
import { saveSession, getSession, getSessionStats } from '../controllers/sessionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, saveSession);
router.get('/', authMiddleware, getSession);
router.get('/stats', authMiddleware, getSessionStats);

export default router;
