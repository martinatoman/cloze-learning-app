import { Router } from "express";

import { testController } from "../controllers/testController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/", authMiddleware, testController.createTest);

router.get("/my", authMiddleware, testController.getMyTests);

router.get("/:test_id/blanks", authMiddleware, testController.getTestWithBlanks);

router.get("/:test_id", authMiddleware, testController.getTestById);

router.put("/:test_id", authMiddleware, testController.updateTest);

router.delete("/:test_id", authMiddleware, testController.deleteTest);

export default router;
