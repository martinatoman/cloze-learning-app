import {
    Response,
    NextFunction
} from "express";

import {
    AuthenticatedRequest
} from "../middleware/auth";

import {
    blankService
} from "../services/blankService";

import {
    parseId
} from "../utils/parseId";


export const blankController = {

    /*
     * =====================================================
     * GET BLANK
     * =====================================================
     */

    async getBlankById(
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

            const blank_id =
                parseId(
                    req.params.blank_id,
                    "blank ID"
                );

            const blank =
                await blankService.getBlankById(
                    blank_id,
                    user_id
                );

            res.json(blank);
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * GET BLANKS BY TEST
     * =====================================================
     */

    async getBlanksByTestId(
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

            const test_id =
                parseId(
                    req.params.test_id,
                    "test ID"
                );

            const blanks =
                await blankService.getBlanksByTestId(
                    test_id,
                    user_id
                );

            res.json(blanks);
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * GET BLANKS BY GROUP
     * =====================================================
     */

    async getBlanksByGroupId(
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

            const group_id =
                parseId(
                    req.params.group_id,
                    "group ID"
                );

            const blanks =
                await blankService.getBlanksByGroupId(
                    group_id,
                    user_id
                );

            res.json(blanks);
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * CREATE BLANK
     * =====================================================
     */

    async createBlank(
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
                        "Authentication required to create blanks.",
                });

                return;
            }

            const {
                test_id,
                group_id,
                word_index,
                word_content,
                description,
            } = req.body;

            const result =
                await blankService.createBlank(
                    user_id,
                    {
                        test_id:
                            Number(
                                test_id
                            ),

                        group_id:
                            Number(
                                group_id
                            ),

                        word_index:
                            Number(
                                word_index
                            ),

                        word_content,

                        description:
                            description ??
                            null,
                    }
                );

            res.status(201).json(
                result
            );
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * UPDATE BLANK
     * =====================================================
     */

    async updateBlank(
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
                        "Authentication required to update blanks.",
                });

                return;
            }

            const blank_id =
                parseId(
                    req.params.blank_id,
                    "blank ID"
                );

            const result =
                await blankService.updateBlank(
                    blank_id,
                    user_id,
                    req.body
                );

            res.json(result);
        } catch (err) {
            next(err);
        }
    },

    /*
     * =====================================================
     * DELETE BLANK
     * =====================================================
     */

    async deleteBlank(
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
                        "Authentication required to delete blanks.",
                });

                return;
            }

            const blank_id =
                parseId(
                    req.params.blank_id,
                    "blank ID"
                );

            const result =
                await blankService.deleteBlank(
                    blank_id,
                    user_id
                );

            res.json(result);
        } catch (err) {
            next(err);
        }
    },
};
