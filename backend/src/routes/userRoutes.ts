import { userController } from '../controllers/userController';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/me', authMiddleware, userController.getMe);

router.post('/xp/complete-test', authMiddleware, userController.completeTest
);

router.get('/:id', authMiddleware, userController.getUserProfile
);

router.patch('/:id', authMiddleware, userController.updateUserProfile
);

export default router;
