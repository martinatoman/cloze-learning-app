import { pool } from '../config/db'; // wherever your pool is
import { PoolConnection } from 'mysql2/promise';

export async function withTransaction<T>(
    fn: (conn: PoolConnection) => Promise<T>
): Promise<T> {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const result = await fn(conn);

        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}