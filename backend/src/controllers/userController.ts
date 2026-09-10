import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { userService } from '../services/userService';

export const userController = {
    async getMe(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const authenticated_user_id = req.user?.user_id;

            if (!authenticated_user_id) {
                res.status(401).json({
                    message: 'Authentication required.'
                });
                return;
            }

            const user = await userService.getUserById(
                authenticated_user_id,
                authenticated_user_id
            );

            res.json({
                user
            });
        } catch (err) {
            next(err);
        }
    },

    async getUserProfile(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const target_user_id = Number(req.params.id);
            const authenticated_user_id = req.user?.user_id;

            if (!authenticated_user_id) {
                res.status(401).json({
                    message: 'Authentication required.'
                });
                return;
            }

            const user = await userService.getUserById(
                target_user_id,
                authenticated_user_id
            );

            res.json(user);
        } catch (err) {
            next(err);
        }
    },

    async updateUserProfile(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const target_user_id = Number(req.params.id);
            const authenticated_user_id = req.user?.user_id;

            if (!authenticated_user_id) {
                res.status(401).json({
                    message: 'Authentication required to update profile.'
                });
                return;
            }

            const updates = req.body;

            const updated = await userService.updateUser(
                target_user_id,
                authenticated_user_id,
                updates
            );

            res.json(updated);
        } catch (err) {
            next(err);
        }
    },

    async completeTest(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const authenticated_user_id = req.user?.user_id;

            if (!authenticated_user_id) {
                res.status(401).json({
                    message: 'Authentication required to submit test XP.'
                });
                return;
            }

            const { test_id, scorePercentage } = req.body;

            const result = await userService.awardXPForTestCompletion(
                authenticated_user_id,
                authenticated_user_id,
                Number(test_id),
                Number(scorePercentage)
            );

            res.json(result);
        } catch (err) {
            next(err);
        }
    },
};
