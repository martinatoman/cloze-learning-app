import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { groupService } from '../services/groupService';
import { parseId } from '../utils/parseId';

export const groupController = {
    async getGroupById(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const user_id = req.user?.user_id;

            if (!user_id) {
                res.status(401).json({
                    message: 'Authentication required.'
                });
                return;
            }

            const group_id = parseId(
                req.params.group_id,
                'group ID'
            );

            const group = await groupService.getGroupById(
                group_id,
                user_id
            );

            res.json(group);
        } catch (err) {
            next(err);
        }
    },

    async getMyGroups(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const user_id = req.user?.user_id;

            if (!user_id) {
                res.status(401).json({
                    message: "Authentication required.",
                });
                return;
            }

            const groups =
                await groupService.getGroupsByUserId(
                    user_id
                );

            res.json(groups);
        } catch (err) {
            next(err);
        }
    },

    async createGroup(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const user_id = req.user?.user_id;

            if (!user_id) {
                res.status(401).json({
                    message: 'Authentication required to create groups.'
                });
                return;
            }

            const { name, color_hex } = req.body;

            const result = await groupService.createGroup(
                user_id,
                name,
                color_hex
            );

            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    },

    async updateGroup(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const user_id = req.user?.user_id;

            if (!user_id) {
                res.status(401).json({
                    message: 'Authentication required to update groups.'
                });
                return;
            }

            const group_id = parseId(
                req.params.group_id,
                'group ID'
            );

            const updates = req.body;

            const result = await groupService.updateGroup(
                group_id,
                user_id,
                updates
            );

            res.json(result);
        } catch (err) {
            next(err);
        }
    },

    async deleteGroup(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const user_id = req.user?.user_id;

            if (!user_id) {
                res.status(401).json({
                    message: 'Authentication required to delete groups.'
                });
                return;
            }

            const group_id = parseId(
                req.params.group_id,
                'group ID'
            );

            const result = await groupService.deleteGroup(
                group_id,
                user_id
            );

            res.json(result);
        } catch (err) {
            next(err);
        }
    },
    
};