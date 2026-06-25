import { Test } from '../../../shared/types';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class TestRepository {
    async getTestById(test_id: number): Promise<Test | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM tests WHERE test_id = ?',
            [test_id]
        );
        return (rows[0] as Test) || null;
    }

    async getTestsByUserId(user_id: number): Promise<Test[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM tests WHERE user_id = ? AND is_deleted = FALSE;',
            [user_id]
        );
        return rows as Test[];
    }

    async createTest(user_id: number, testData: Omit<Test, 'test_id' | 'user_id' | 'created_at' | 'is_deleted'>): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO tests (user_id, title, original_text, is_deleted) VALUES (?, ?, ?, FALSE)',
            [user_id, testData.title, testData.original_text]
        );
        return result.insertId
    }

    async updateTest(test_id: number, updateData: Partial<Pick<Test, 'title' | 'original_text'>>): Promise<void> {
        await pool.query(
            'UPDATE tests SET title = IFNULL(?, title), original_text = IFNULL(?, original_text) WHERE test_id = ?',
            [updateData.title, updateData.original_text, test_id]
        );
    }

    async deleteTest(test_id: number): Promise<void> {
        await pool.query(
            'UPDATE tests SET is_deleted = TRUE WHERE test_id = ?',
            [test_id]
        );
    }
}