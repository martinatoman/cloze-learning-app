import {
    Response,
    NextFunction
} from "express";

import { AuthenticatedRequest } from "../middleware/auth";
import { testService } from "../services/testService";
import { parseId } from "../utils/parseId";

export const testController = {
    /*
     * =====================================================
     * GET TEST
     * =====================================================
     */

    async getTestById(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const test_id =
                parseId(
                    req.params.test_id,
                    "test ID"
                );

            const user_id =
                req.user?.user_id;

            const test =
                await testService.getTestById(
                    test_id,
                    user_id
                );

            res.json(test);
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * GET MY TESTS
     * =====================================================
     */

    async getMyTests(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const user_id =
                req.user?.user_id;

            if (!user_id) {
                res.status(401).json({
                    message:
                        "Authentication required.",
                });

                return;
            }

            const tests =
                await testService.getTestsByUserId(
                    user_id
                );

            res.json(tests);
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * GET TEST + BLANKS
     * =====================================================
     */

    async getTestWithBlanks(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const test_id =
                parseId(
                    req.params.test_id,
                    "test ID"
                );

            const user_id =
                req.user?.user_id;

            const result =
                await testService.getTestWithBlanks(
                    test_id,
                    user_id
                );

            res.json(result);
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * CREATE TEST
     * =====================================================
     */

    async createTest(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const user_id =
                req.user?.user_id ??
                null;

            const {
                title,
                original_text,
                blanks,
            } = req.body;

            const result =
                await testService.createTest(
                    user_id,
                    title,
                    original_text,
                    blanks
                );

            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * UPDATE TEST
     * =====================================================
     */

    async updateTest(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const test_id =
                parseId(
                    req.params.test_id,
                    "test ID"
                );

            const user_id =
                req.user?.user_id;

            if (!user_id) {
                res.status(401).json({
                    message:
                        "Authentication required to update tests.",
                });

                return;
            }

            const updated =
                await testService.updateTest(
                    test_id,
                    user_id,
                    req.body
                );

            res.json(updated);
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * DELETE TEST
     * =====================================================
     */

    async deleteTest(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const test_id =
                parseId(
                    req.params.test_id,
                    "test ID"
                );

            const user_id =
                req.user?.user_id;

            if (!user_id) {
                res.status(401).json({
                    message:
                        "Authentication required to delete tests.",
                });

                return;
            }

            const result =
                await testService.deleteTest(
                    test_id,
                    user_id
                );

            res.json(result);
        } catch (err) {
            next(err);
        }
    },
};
