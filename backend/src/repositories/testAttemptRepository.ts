import { TestAttempt } from '../../../shared/types';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class TestAttemptRepository {
    async getAllTestAttempts(): Promise<TestAttempt[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM test_attempts'
        );
        return rows as TestAttempt[];
    }

    async getTestAttemptById(attempt_id: number): Promise<TestAttempt | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM test_attempts WHERE attempt_id = ?',
            [attempt_id]
        );
        return (rows[0] as TestAttempt) || null;
    }

    async getTestAttemptsByTestId(test_id: number): Promise<TestAttempt[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM test_attempts WHERE test_id = ?',
            [test_id]
        );
        return rows as TestAttempt[];
    }

    async createTestAttempt(attemptData: Omit<TestAttempt, 'attempt_id'>): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO test_attempts (user_id, test_id, score, completed_at) VALUES (?, ?, ?, ?)',
            [
                attemptData.user_id,
                attemptData.test_id,
                attemptData.score,
                attemptData.completed_at
            ]
        );
        return result.insertId;
    }
}

export const testAttemptRepository = new TestAttemptRepository();