import { testAttemptController } from "../controllers/testAttemptController";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Test attempt routes require authentication
router.get('/', authMiddleware, testAttemptController.getAllTestAttempts);
router.get('/:attempt_id', authMiddleware, testAttemptController.getTestAttemptById);
router.get('/test/:test_id', authMiddleware, testAttemptController.getTestAttemptsByTestId);
router.post('/', authMiddleware, testAttemptController.createTestAttempt);

export default router;