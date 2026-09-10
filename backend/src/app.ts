import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Import all routers
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import testRoutes from './routes/testRoutes';
import groupRoutes from './routes/groupRoutes';
import blankRoutes from './routes/blankRoutes';
import testAttemptRoutes from './routes/testAttemptRoutes';
import { AppError } from './utils/appError';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/blanks', blankRoutes);
app.use('/api/test-attempts', testAttemptRoutes);

app.use((req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';

    if (statusCode === 500) {
        console.error('UNHANDLED ERROR:', err);
    }

    res.status(statusCode).json({
        status,
        message: err.message || 'Internal Server Error',
    });
});

export default app;
