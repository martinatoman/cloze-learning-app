import { testAttemptRepository } from '../repositories/testAttemptRepository';
import { userService } from './userService';
import { AppError } from '../utils/appError';
import { TestAttempt } from '../../../shared/types';

export const testAttemptService = {
    async getAllTestAttempts(): Promise<TestAttempt[]> {
        return await testAttemptRepository.getAllTestAttempts();
    },

    async getTestAttemptById(attempt_id: number, user_id?: number): Promise<TestAttempt> {
        const attempt = await testAttemptRepository.getTestAttemptById(attempt_id);

        if (!attempt) {
            throw new AppError('Test attempt not found', 404);
        }

        if (user_id && attempt.user_id !== user_id) {
            throw new AppError('Unauthorized access to test attempt', 403);
        }

        return attempt;
    },

    async getTestAttemptsByTestId(test_id: number): Promise<TestAttempt[]> {
        return await testAttemptRepository.getTestAttemptsByTestId(test_id);
    },

    async createTestAttempt(
        user_id: number,
        test_id: number,
        score: number
    ): Promise<{ attempt_id: number; xpResult?: any }> {
        if (score === undefined || score === null || score < 0) {
            throw new AppError('A valid score is required', 400);
        }

        const attempt_id = await testAttemptRepository.createTestAttempt({
            user_id,
            test_id,
            score,
            completed_at: new Date() as any,
        });

        let xpResult = null;
        try {
            xpResult = await userService.awardXPForTestCompletion(
                user_id,
                user_id,
                test_id,
                score
            );
        } catch (error) {
            console.error('Failed to award XP for test completion:', error);
        }

        return { attempt_id, xpResult };
    },
};