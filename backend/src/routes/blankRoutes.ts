import { blankController } from '../controllers/blankController';
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get(
    '/test/:test_id',
    authMiddleware,
    blankController.getBlanksByTestId
);

router.get(
    '/group/:group_id',
    authMiddleware,
    blankController.getBlanksByGroupId
);

router.get(
    '/:blank_id',
    authMiddleware,
    blankController.getBlankById
);

router.post(
    '/',
    authMiddleware,
    blankController.createBlank
);

router.put(
    '/:blank_id',
    authMiddleware,
    blankController.updateBlank
);

router.delete(
    '/:blank_id',
    authMiddleware,
    blankController.deleteBlank
);

export default router;