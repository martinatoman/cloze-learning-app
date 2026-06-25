import { Group } from '../../../shared/types';
import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class GroupRepository {
    async getGroupById(group_id: number): Promise<Group | null> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM groups WHERE group_id = ? AND is_deleted = FALSE',
            [group_id]
        );
        return (rows[0] as Group) || null;
    }
    
    async getGroupsByUserId(user_id: number): Promise<Group[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM groups WHERE user_id = ? AND is_deleted = FALSE',
            [user_id]
        );
        return rows as Group[];
    }

    async createGroup(user_id: number, groupData: Omit<Group, 'group_id' | 'user_id' | 'is_deleted'>): Promise<number> {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO groups (user_id, name, color_hex, is_deleted) VALUES (?, ?, ?, FALSE)',
            [user_id, groupData.name, groupData.color_hex]
        );
        return result.insertId;
    }
    
    async updateGroup(group_id: number, updateData: Partial<Pick<Group, 'name' | 'color_hex'>>): Promise<void> {
        await pool.query(
            'UPDATE groups SET name = IFNULL(?, name), color_hex = IFNULL(?, color_hex) WHERE group_id = ?',
            [updateData.name, updateData.color_hex, group_id]
        );
    }

    async deleteGroup(group_id: number): Promise<void> {
        await pool.query(
            'UPDATE groups SET is_deleted = TRUE WHERE group_id = ?',
            [group_id]
        );
    }
}