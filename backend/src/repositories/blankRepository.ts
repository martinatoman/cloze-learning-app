import { pool } from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Blank } from '../../../shared/types';

export class BlankRepository {
    async getBlankById(blank_id: number): Promise<Blank | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM blanks WHERE blank_id = ? AND is_deleted = FALSE',
            [blank_id]
        );
        return (rows[0] as Blank) || null;
    }

    async getBlanksByTestId(test_id: number): Promise<Blank[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM blanks WHERE test_id = ? AND is_deleted = FALSE ORDER BY word_index ASC',
            [test_id]
        );
        return rows as Blank[];
    }

    async getBlanksByGroupId(group_id: number): Promise<Blank[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM blanks WHERE group_id = ? AND is_deleted = FALSE ORDER BY word_index ASC',
            [group_id]
        );
        return rows as Blank[];
    }

    async createBlank(blankData: Omit<Blank, 'blank_id' | 'is_deleted'>): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO blanks (test_id, group_id, word_index, word_content, description, is_deleted) VALUES (?, ?, ?, ?, ?, FALSE)',
            [blankData.test_id, blankData.group_id, blankData.word_index, blankData.word_content, blankData.description]
        );
        return result.insertId;
    }
    
    async updateBlank(blank_id: number, updates: Partial<Pick<Blank, 'word_index' | 'word_content' | 'description' | 'group_id'>>): Promise<void> {
        await pool.query(
            `UPDATE blanks SET 
             word_index = IFNULL(?, word_index), 
             word_content = IFNULL(?, word_content), 
             description = IFNULL(?, description), 
             group_id = IFNULL(?, group_id) 
             WHERE blank_id = ?`,
            [updates.word_index, updates.word_content, updates.description, updates.group_id, blank_id]
        );
    }

    async deleteBlanksByTestId(test_id: number): Promise<void> {
        await pool.query('UPDATE blanks SET is_deleted = TRUE WHERE test_id = ?', [test_id]);
    }

    async deleteBlank(blank_id: number): Promise<void> {
        await pool.query('UPDATE blanks SET is_deleted = TRUE WHERE blank_id = ?', [blank_id]);
    }
}