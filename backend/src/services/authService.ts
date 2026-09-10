import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository';
import { groupRepository } from '../repositories/groupRepository';
import { User } from '../../../shared/types';
import { AppError } from '../utils/appError';

type PublicUser = Omit<User, 'password_hash'>;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
}

export const authService = {
    async register(data: {
        username: string;
        display_name: string;
        password: string;
    }): Promise<{ user: PublicUser; token: string }> {

        const { username, display_name, password } = data;

        if (!username?.trim() || !display_name?.trim() || !password?.trim()) {
            throw new AppError(
                'Username, display name, and password are required',
                400
            );
        }

        const existing = await userRepository.getUserByUsername(username);

        if (existing) {
            throw new AppError('Username is already taken', 409);
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUserId = await userRepository.createUser({
            username: username.trim(),
            display_name: display_name.trim(),
            password_hash
        });

        const newUser = await userRepository.getUserById(Number(newUserId));

        if (!newUser) {
            throw new AppError('Failed to create user', 500);
        }

        const defaultGroups = [
            { name: 'Context A', color_hex: '#ef4444' },
            { name: 'Context B', color_hex: '#3b82f6' },
            { name: 'Context C', color_hex: '#10b981' },
            { name: 'Context D', color_hex: '#a855f7' }
        ];

        for (const group of defaultGroups) {
            await groupRepository.createGroup(newUser.user_id, {
                name: group.name,
                color_hex: group.color_hex
            });
        }

        const { password_hash: _, ...publicUser } = newUser;

        const token = jwt.sign(
            {
                user_id: newUser.user_id,
                username: newUser.username
            },
            JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        return {
            user: publicUser,
            token
        };
    },

    async login(data: {
        username: string;
        password: string;
    }): Promise<{ user: PublicUser; token: string }> {

        const { username, password } = data;

        if (!username?.trim() || !password?.trim()) {
            throw new AppError(
                'Username and password are required',
                400
            );
        }

        const user = await userRepository.getUserByUsername(username.trim());

        if (!user) {
            throw new AppError('Invalid username or password', 401);
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            throw new AppError('Invalid username or password', 401);
        }

        const { password_hash: _, ...publicUser } = user;

        const token = jwt.sign(
            {
                user_id: user.user_id,
                username: user.username
            },
            JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        return {
            user: publicUser,
            token
        };
    }
};
