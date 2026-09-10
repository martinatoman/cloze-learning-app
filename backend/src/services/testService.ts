import {
    testRepository
} from "../repositories/testRepository";

import {
    blankRepository
} from "../repositories/blankRepository";

import {
    AppError
} from "../utils/appError";

import {
    checkOwnership
} from "../utils/security";

import {
    CreateBlank,
    Test,
    Blank
} from "../../../shared/types";

import {
    withTransaction
} from "../utils/withTransaction";


type PublicTest =
    Omit<Test, "is_deleted">;

type PublicBlank =
    Omit<Blank, "is_deleted">;

/*
 * =====================================================
 * PUBLIC SERIALIZATION
 * =====================================================
 */

const toPublicTest = (
    test: Test
): PublicTest => {
    const {
        is_deleted,
        ...publicTest
    } = test;

    return publicTest;
};

const toPublicBlank = (
    blank: Blank
): PublicBlank => {
    const {
        is_deleted,
        ...publicBlank
    } = blank;

    return publicBlank;
};

/*
 * =====================================================
 * VALIDATION
 * =====================================================
 */

function validateTitle(
    title: string
) {
    if (
        typeof title !== "string" ||
        !title.trim()
    ) {
        throw new AppError(
            "Title is required",
            400
        );
    }
}

function validateContent(
    content: string
) {
    if (
        typeof content !== "string" ||
        !content.trim()
    ) {
        throw new AppError(
            "Content is required",
            400
        );
    }
}

function validateBlanks(
    blanks: CreateBlank[]
) {
    if (
        !Array.isArray(blanks) ||
        blanks.length === 0
    ) {
        throw new AppError(
            "A test must contain at least one blank.",
            400
        );
    }

    for (
        const blank of blanks
    ) {
        if (
            !Number.isInteger(
                Number(
                    blank.group_id
                )
            ) ||
            Number(
                blank.group_id
            ) <= 0
        ) {
            throw new AppError(
                "Invalid group ID in blank.",
                400
            );
        }

        if (
            !Number.isInteger(
                Number(
                    blank.word_index
                )
            ) ||
            Number(
                blank.word_index
            ) < 0
        ) {
            throw new AppError(
                "Invalid word index in blank.",
                400
            );
        }

        if (
            typeof blank.word_content !==
            "string" ||
            !blank.word_content.trim()
        ) {
            throw new AppError(
                "Blank word content is required.",
                400
            );
        }

        if (
            blank.description !== null &&
            blank.description !== undefined &&
            typeof blank.description !==
            "string"
        ) {
            throw new AppError(
                "Invalid blank description.",
                400
            );
        }
    }
}

/*
 * =====================================================
 * TEST ACCESS
 * =====================================================
 */

async function requireTestAccess(
    test_id: number,
    user_id?: number
): Promise<Test> {
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

    checkOwnership(
        test,
        user_id ?? null,
        "Test",
        true
    );

    return test;
}

/*
 * =====================================================
 * SERVICE
 * =====================================================
 */

export const testService = {
    /*
     * -----------------------------------------------------
     * GET TEST
     * -----------------------------------------------------
     */

    async getTestById(
        test_id: number,
        user_id?: number
    ): Promise<PublicTest> {
        const test =
            await requireTestAccess(
                test_id,
                user_id
            );

        return toPublicTest(test);
    },

    /*
     * -----------------------------------------------------
     * GET MY TESTS
     * -----------------------------------------------------
     */

    async getTestsByUserId(
        user_id: number
    ): Promise<PublicTest[]> {
        const tests =
            await testRepository.getTestsByUserId(
                user_id
            );

        return tests.map(
            toPublicTest
        );
    },

    /*
     * -----------------------------------------------------
     * GET TEST WITH BLANKS
     * -----------------------------------------------------
     */

    async getTestWithBlanks(
        test_id: number,
        user_id?: number
    ): Promise<
        PublicTest & {
            blanks: PublicBlank[];
        }
    > {
        const test =
            await requireTestAccess(
                test_id,
                user_id
            );

        const blanks =
            await blankRepository.getBlanksByTestId(
                test_id
            );

        return {
            ...toPublicTest(
                test
            ),

            blanks:
                blanks.map(
                    toPublicBlank
                ),
        };
    },

    /*
     * -----------------------------------------------------
     * CREATE TEST
     * -----------------------------------------------------
     */

    async createTest(
        user_id: number | null,
        title: string,
        original_text: string,
        blanks: CreateBlank[]
    ): Promise<{
        test_id: number | null;
        message?: string;
    }> {
        validateTitle(title);
        validateContent(original_text);
        validateBlanks(blanks);

        /*
         * Anonymous users can preview,
         * but don't create database rows.
         */

        if (
            user_id === null
        ) {
            return {
                test_id: null,

                message:
                    "Preview mode: Test not saved.",
            };
        }

        /*
         * =================================================
         * TRANSACTION
         * =================================================
         */

        return withTransaction(
            async (tx) => {
                const test_id =
                    await testRepository.createTest(
                        user_id,
                        {
                            title:
                                title.trim(),

                            original_text,
                        },
                        tx
                    );

                await blankRepository.insertBlanks(
                    blanks.map(
                        (
                            blank
                        ) => ({
                            test_id,

                            group_id:
                                Number(
                                    blank.group_id
                                ),

                            word_index:
                                Number(
                                    blank.word_index
                                ),

                            word_content:
                                blank.word_content.trim(),

                            description:
                                blank.description ??
                                null,
                        })
                    ),
                    tx
                );

                return {
                    test_id,
                };
            }
        );
    },

    /*
     * -----------------------------------------------------
     * UPDATE TEST
     * -----------------------------------------------------
     */

    async updateTest(
        test_id: number,
        user_id: number,
        updates: {
            title?: string;
            original_text?: string;
        }
    ): Promise<PublicTest> {
        if (
            !updates ||
            Object.keys(
                updates
            ).length === 0
        ) {
            throw new AppError(
                "No updates provided",
                400
            );
        }

        if (
            updates.title !==
            undefined
        ) {
            validateTitle(
                updates.title
            );
        }

        if (
            updates.original_text !==
            undefined
        ) {
            validateContent(
                updates.original_text
            );
        }

        await requireTestAccess(
            test_id,
            user_id
        );

        await testRepository.updateTest(
            test_id,
            {
                ...(updates.title !==
                    undefined
                    ? {
                        title:
                            updates.title.trim(),
                    }
                    : {}),

                ...(updates.original_text !==
                    undefined
                    ? {
                        original_text:
                            updates.original_text,
                    }
                    : {}),
            }
        );

        const updated =
            await testRepository.getTestById(
                test_id
            );

        if (!updated) {
            throw new AppError(
                "Update failed",
                500
            );
        }

        return toPublicTest(
            updated
        );
    },

    /*
     * -----------------------------------------------------
     * DELETE TEST
     * -----------------------------------------------------
     */

    async deleteTest(
        test_id: number,
        user_id: number
    ): Promise<{
        success: true;
    }> {
        await requireTestAccess(
            test_id,
            user_id
        );

        await withTransaction(
            async (tx) => {
                await blankRepository.deleteBlanksByTestId(
                    test_id,
                    tx
                );

                await testRepository.deleteTest(
                    test_id,
                    tx
                );
            }
        );

        return {
            success: true,
        };
    },
};
