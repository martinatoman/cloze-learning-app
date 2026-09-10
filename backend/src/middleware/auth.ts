import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface DecodedToken extends JwtPayload {
    user_id: number;
    username: string;
}

export interface AuthenticatedRequest extends Request {
    user?: {
        user_id: number;
        username: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error(
        'FATAL ERROR: JWT_SECRET is not defined in environment variables.'
    );
}

export const authMiddleware = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            message: 'Access denied. No token provided.',
        });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

        req.user = {
            user_id: decoded.user_id,
            username: decoded.username,
        };

        next();
    } catch {
        res.status(403).json({
            message: 'Invalid or expired token.',
        });
    }
};