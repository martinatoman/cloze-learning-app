import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { testAttemptService } from '../services/testAttemptService';

export const testAttemptController = {
    async getAllTestAttempts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const attempts = await testAttemptService.getAllTestAttempts();
            res.json(attempts);
        } catch (err) {
            next(err);
        }
    },

    async getTestAttemptById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const attempt_id = Number(req.params.attempt_id);
            const user_id = req.user?.user_id;

            const attempt = await testAttemptService.getTestAttemptById(attempt_id, user_id);
            res.json(attempt);
        } catch (err) {
            next(err);
        }
    },

    async getTestAttemptsByTestId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const test_id = Number(req.params.test_id);
            const attempts = await testAttemptService.getTestAttemptsByTestId(test_id);
            res.json(attempts);
        } catch (err) {
            next(err);
        }
    },

    async createTestAttempt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const user_id = req.user?.user_id;

            if (!user_id) {
                res.status(401).json({ message: 'Authentication required to save test attempts.' });
                return;
            }

            const { test_id, score } = req.body;
            const result = await testAttemptService.createTestAttempt(
                user_id,
                Number(test_id),
                Number(score)
            );

            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    },
};