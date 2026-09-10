import {
    blankRepository
} from "../repositories/blankRepository";

import {
    testRepository
} from "../repositories/testRepository";

import {
    groupRepository
} from "../repositories/groupRepository";

import {
    AppError
} from "../utils/appError";

import {
    checkOwnership
} from "../utils/security";

import {
    Blank
} from "../../../shared/types";

/*
 * =====================================================
 * BLANK ACCESS
 * =====================================================
 */

async function requireBlankAccess(
    blank_id: number,
    user_id: number
): Promise<Blank> {
    const blank =
        await blankRepository.getBlankById(
            blank_id
        );

    if (!blank) {
        throw new AppError(
            "Blank not found",
            404
        );
    }

    const test =
        await testRepository.getTestById(
            blank.test_id
        );

    if (!test) {
        throw new AppError(
            "Test not found",
            404
        );
    }

    if (
        test.user_id === null
    ) {
        throw new AppError(
            "Anonymous test blanks cannot be modified by users.",
            403
        );
    }

    checkOwnership(
        test,
        user_id,
        "Blank"
    );

    return blank;
}

/*
 * =====================================================
 * TEST ACCESS
 * =====================================================
 */

async function requireTestAccess(
    test_id: number,
    user_id: number
) {
    const test =
        await testRepository.getTestById(
            test_id
        );

    if (!test) {
        throw new AppError(
            "Test not found",
            404
        );
    }

    if (
        test.user_id === null
    ) {
        throw new AppError(
            "Anonymous test blanks cannot be modified by users.",
            403
        );
    }

    checkOwnership(
        test,
        user_id,
        "Test"
    );

    return test;
}

/*
 * =====================================================
 * GROUP ACCESS
 * =====================================================
 */

async function requireGroupOwnership(
    group_id: number,
    user_id: number
) {
    if (
        !Number.isInteger(
            group_id
        ) ||
        group_id <= 0
    ) {
        throw new AppError(
            "Invalid group ID.",
            400
        );
    }

    const group =
        await groupRepository.getGroupById(
            group_id
        );

    if (!group) {
        throw new AppError(
            "Group not found",
            404
        );
    }

    checkOwnership(
        group,
        user_id,
        "Group"
    );

    return group;
}

/*
 * =====================================================
 * SERVICE
 * =====================================================
 */

export const blankService = {

    /*
     * -----------------------------------------------------
     * GET BLANK
     * -----------------------------------------------------
     */

    async getBlankById(
        blank_id: number,
        user_id: number
    ): Promise<Blank> {
        return requireBlankAccess(
            blank_id,
            user_id
        );
    },

    /*
     * -----------------------------------------------------
     * GET BY TEST
     * -----------------------------------------------------
     */

    async getBlanksByTestId(
        test_id: number,
        user_id: number
    ): Promise<Blank[]> {
        await requireTestAccess(
            test_id,
            user_id
        );

        return blankRepository.getBlanksByTestId(
            test_id
        );
    },

    /*
     * -----------------------------------------------------
     * GET BY GROUP
     * -----------------------------------------------------
     */

    async getBlanksByGroupId(
        group_id: number,
        user_id: number
    ): Promise<Blank[]> {
        await requireGroupOwnership(
            group_id,
            user_id
        );

        return blankRepository.getBlanksByGroupId(
            group_id
        );
    },

    /*
     * -----------------------------------------------------
     * CREATE
     * -----------------------------------------------------
     */

    async createBlank(
        user_id: number,
        blankData: Omit<
            Blank,
            "blank_id" |
            "is_deleted"
        >
    ): Promise<{
        blank_id: number;
    }> {
        if (
            !blankData.word_content?.trim()
        ) {
            throw new AppError(
                "Word content is required for a blank",
                400
            );
        }

        if (
            !Number.isInteger(
                blankData.word_index
            ) ||
            blankData.word_index < 0
        ) {
            throw new AppError(
                "Word index must be a non-negative integer",
                400
            );
        }

        await requireTestAccess(
            blankData.test_id,
            user_id
        );

        await requireGroupOwnership(
            blankData.group_id,
            user_id
        );

        const blank_id =
            await blankRepository.createBlank(
                {
                    ...blankData,

                    word_content:
                        blankData.word_content.trim(),

                    description:
                        blankData.description ??
                        null,
                }
            );

        return {
            blank_id,
        };
    },

    /*
     * -----------------------------------------------------
     * UPDATE
     * -----------------------------------------------------
     */

    async updateBlank(
        blank_id: number,
        user_id: number,
        updates: Partial<
            Pick<
                Blank,
                | "word_index"
                | "word_content"
                | "description"
                | "group_id"
            >
        >
    ): Promise<{
        message: string;
    }> {
        await requireBlankAccess(
            blank_id,
            user_id
        );

        if (
            updates.word_content !==
            undefined
        ) {
            if (
                typeof updates.word_content !==
                "string" ||
                !updates.word_content.trim()
            ) {
                throw new AppError(
                    "Word content cannot be empty",
                    400
                );
            }
        }

        if (
            updates.word_index !==
            undefined
        ) {
            if (
                !Number.isInteger(
                    updates.word_index
                ) ||
                updates.word_index < 0
            ) {
                throw new AppError(
                    "Word index must be a non-negative integer",
                    400
                );
            }
        }

        if (
            updates.description !==
            undefined &&
            updates.description !==
            null &&
            typeof updates.description !==
            "string"
        ) {
            throw new AppError(
                "Invalid description",
                400
            );
        }

        if (
            updates.group_id !==
            undefined
        ) {
            await requireGroupOwnership(
                Number(
                    updates.group_id
                ),
                user_id
            );
        }

        await blankRepository.updateBlank(
            blank_id,
            {
                ...(updates.word_content !==
                    undefined
                    ? {
                        word_content:
                            updates.word_content.trim(),
                    }
                    : {}),

                ...(updates.word_index !==
                    undefined
                    ? {
                        word_index:
                            updates.word_index,
                    }
                    : {}),

                ...(updates.description !==
                    undefined
                    ? {
                        description:
                            updates.description ===
                                ""
                                ? null
                                : updates.description,
                    }
                    : {}),

                ...(updates.group_id !==
                    undefined
                    ? {
                        group_id:
                            Number(
                                updates.group_id
                            ),
                    }
                    : {}),
            }
        );

        return {
            message:
                "Blank updated successfully",
        };
    },

    /*
     * -----------------------------------------------------
     * DELETE
     * -----------------------------------------------------
     */

    async deleteBlank(
        blank_id: number,
        user_id: number
    ): Promise<{
        message: string;
    }> {
        await requireBlankAccess(
            blank_id,
            user_id
        );

        await blankRepository.deleteBlank(
            blank_id
        );

        return {
            message:
                "Blank deleted successfully",
        };
    },
};
