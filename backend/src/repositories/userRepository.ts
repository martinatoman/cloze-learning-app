import { User } from '../../../shared/types';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class UserRepository {
    async getUserById(user_id: number): Promise<User | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM users WHERE user_id = ?',
            [user_id]
        );

        return (rows[0] as User) || null;
    }

    async getUserByUsername(username: string): Promise<User | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        return (rows[0] as User) || null;
    }

    async createUser(userData: Omit<User, 'user_id' | 'total_xp'>): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)',
            [userData.username, userData.display_name, userData.password_hash]
        );
        return result.insertId;
    }

    async updateUser(user_id: number, updateData: Partial<Pick<User, 'username' | 'display_name' | 'password_hash'>>): Promise<void> {
        await pool.query(
            `UPDATE users SET 
             username = IFNULL(?, username), 
             display_name = IFNULL(?, display_name), 
             password_hash = IFNULL(?, password_hash) 
             WHERE user_id = ?`,
            [updateData.username, updateData.display_name, updateData.password_hash, user_id]
        );
    }

    async updateUserXP(user_id: number, new_xp: number): Promise<void> {
        await pool.query('UPDATE users SET total_xp = ? WHERE user_id = ?', [new_xp, user_id]);
    }
}

export const userRepository = new UserRepository();