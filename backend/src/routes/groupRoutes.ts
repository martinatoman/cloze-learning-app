import { groupController } from "../controllers/groupController";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get('/my', authMiddleware, groupController.getMyGroups);

router.get('/:group_id', authMiddleware, groupController.getGroupById);

router.post('/', authMiddleware, groupController.createGroup);

router.put('/:group_id', authMiddleware, groupController.updateGroup);

router.delete('/:group_id', authMiddleware, groupController.deleteGroup);

export default router;