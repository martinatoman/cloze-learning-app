import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

export const authController = {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, display_name, password } = req.body;

            const result = await authService.register({
                username,
                display_name,
                password
            });

            res.status(201).json({
                message: 'User registered successfully',
                user: result.user,
                token: result.token
            });
        } catch (err) {
            next(err);
        }
    },

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { username, password } = req.body;

            const result = await authService.login({
                username,
                password
            });

            res.json({
                message: 'Logged in successfully',
                user: result.user,
                token: result.token
            });
        } catch (err) {
            next(err);
        }
    }
};
