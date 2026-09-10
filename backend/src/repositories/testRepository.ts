import {
    Test
} from "../../../shared/types";

import {
    pool,
    QueryExecutor
} from "../config/db";

import {
    RowDataPacket,
    ResultSetHeader
} from "mysql2/promise";


export class TestRepository {
    /*
     * =====================================================
     * GET TEST BY ID
     * =====================================================
     */

    async getTestById(
        test_id: number,
        tx: QueryExecutor = pool
    ): Promise<Test | null> {
        const [
            rows
        ] =
            await tx.query<RowDataPacket[]>(
                `
                SELECT
                    test_id,
                    user_id,
                    title,
                    original_text,
                    created_at,
                    is_deleted
                FROM tests
                WHERE test_id = ?
                  AND is_deleted = FALSE
                LIMIT 1
                `,
                [test_id]
            );

        return (
            rows[0] as Test
        ) || null;
    }

    /*
     * =====================================================
     * GET MY TESTS
     * =====================================================
     */

    async getTestsByUserId(
        user_id: number,
        tx: QueryExecutor = pool
    ): Promise<Test[]> {
        const [
            rows
        ] =
            await tx.query<RowDataPacket[]>(
                `
                SELECT
                    test_id,
                    user_id,
                    title,
                    original_text,
                    created_at,
                    is_deleted
                FROM tests
                WHERE user_id = ?
                  AND is_deleted = FALSE
                ORDER BY created_at DESC
                `,
                [user_id]
            );

        return rows as Test[];
    }

    /*
     * =====================================================
     * CREATE TEST
     * =====================================================
     */

    async createTest(
        user_id: number,
        testData: Omit<
            Test,
            | "test_id"
            | "user_id"
            | "created_at"
            | "is_deleted"
        >,
        tx: QueryExecutor = pool
    ): Promise<number> {
        const [
            result
        ] =
            await tx.query<ResultSetHeader>(
                `
                INSERT INTO tests
                    (
                        user_id,
                        title,
                        original_text,
                        is_deleted
                    )
                VALUES
                    (?, ?, ?, FALSE)
                `,
                [
                    user_id,
                    testData.title,
                    testData.original_text,
                ]
            );

        return result.insertId;
    }

    /*
     * =====================================================
     * UPDATE TEST
     * =====================================================
     */

    async updateTest(
        test_id: number,
        updateData: Partial<
            Pick<
                Test,
                "title" |
                "original_text"
            >
        >,
        tx: QueryExecutor = pool
    ): Promise<void> {
        await tx.query(
            `
            UPDATE tests
            SET
                title =
                    IFNULL(
                        ?,
                        title
                    ),

                original_text =
                    IFNULL(
                        ?,
                        original_text
                    )
            WHERE test_id = ?
              AND is_deleted = FALSE
            `,
            [
                updateData.title ??
                null,

                updateData.original_text ??
                null,

                test_id,
            ]
        );
    }

    /*
     * =====================================================
     * SOFT DELETE
     * =====================================================
     */

    async deleteTest(
        test_id: number,
        tx: QueryExecutor = pool
    ): Promise<void> {
        await tx.query(
            `
            UPDATE tests
            SET is_deleted = TRUE
            WHERE test_id = ?
            `,
            [test_id]
        );
    }
}


export const testRepository =
    new TestRepository();
