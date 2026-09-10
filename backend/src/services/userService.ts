import { userRepository } from '../repositories/userRepository';
import { testRepository } from '../repositories/testRepository';
import { User } from '../../../shared/types';
import { calculateLevel } from '../utils/progression';
import { AppError } from '../utils/appError';

type PublicUser = Omit<User, 'password_hash'>;
type UserWithProgression = PublicUser & {
    level: number;
    currentXP: number;
    nextLevelXP: number;
};

const toPublicUser = ({ password_hash, ...user }: User): UserWithProgression => {
    const progression = calculateLevel(user.total_xp);
    return {
        ...user,
        ...progression,
    };
};

function validateUsername(username: string) {
    if (!username?.trim()) {
        throw new AppError('Username is required', 400);
    }
}

function validateDisplayName(display_name: string) {
    if (!display_name?.trim()) {
        throw new AppError('Display name is required', 400);
    }
}

async function requireUserAccess(
    target_user_id: number,
    authenticated_user_id: number
): Promise<User> {
    const user = await userRepository.getUserById(target_user_id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.user_id !== authenticated_user_id) {
        throw new AppError('Unauthorized access to user profile', 403);
    }

    return user;
}

export const userService = {
    async getUserById(
        user_id: number,
        authenticated_user_id: number
    ): Promise<UserWithProgression> {
        const user = await requireUserAccess(user_id, authenticated_user_id);
        return toPublicUser(user);
    },

    async updateUser(
        user_id: number,
        authenticated_user_id: number,
        updates: {
            username?: string;
            display_name?: string;
            password_hash?: string;
        }
    ): Promise<UserWithProgression> {
        if (!updates || Object.keys(updates).length === 0) {
            throw new AppError('No updates provided', 400);
        }

        if (updates.username !== undefined) {
            validateUsername(updates.username);
        }

        if (updates.display_name !== undefined) {
            validateDisplayName(updates.display_name);
        }

        await requireUserAccess(user_id, authenticated_user_id);

        await userRepository.updateUser(user_id, updates);

        const updated = await userRepository.getUserById(user_id);

        if (!updated) {
            throw new AppError('Update failed', 500);
        }

        return toPublicUser(updated);
    },

    async awardXPForTestCompletion(
        user_id: number,
        authenticated_user_id: number,
        test_id: number,
        scorePercentage: number
    ): Promise<{ user: UserWithProgression; xpGained: number }> {
        if (scorePercentage < 0 || scorePercentage > 100) {
            throw new AppError('Invalid score percentage', 400);
        }

        const user = await requireUserAccess(user_id, authenticated_user_id);

        const test = await testRepository.getTestById(test_id);
        if (!test) {
            throw new AppError('Test not found', 404);
        }

        const baseXP = 50;
        const xpGained = Math.round(baseXP * (scorePercentage / 100));

        if (xpGained <= 0) {
            return { user: toPublicUser(user), xpGained: 0 };
        }

        const newTotalXP = (user.total_xp || 0) + xpGained;

        await userRepository.updateUserXP(user_id, newTotalXP);

        const updated = await userRepository.getUserById(user_id);

        if (!updated) {
            throw new AppError('Failed to update XP progression', 500);
        }

        return {
            user: toPublicUser(updated),
            xpGained,
        };
    },
};