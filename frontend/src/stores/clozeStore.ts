import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "./authStore";
import { api } from "../services/api";

import type {
    BlankedWord,
    ClozeTest,
    HighlightColor,
    LibraryEntry,
    TestToken,
} from "../../../shared/types";

export const useClozeStore = defineStore(
    "cloze",
    () => {
        const authStore = useAuthStore();

        /*
         * =====================================================
         * STATE
         * =====================================================
         */

        const original_text =
            ref<string>("");

        const currentBlankedWords =
            ref<BlankedWord[]>([]);

        const savedTests =
            ref<ClozeTest[]>([]);

        const wordLibrary =
            ref<LibraryEntry[]>([]);

        const isLoading =
            ref<boolean>(false);

        const temporaryActiveTest =
            ref<any | null>(null);

        /*
         * =====================================================
         * SOURCE TEXT
         * =====================================================
         */

        const sourceText = computed({
            get: () =>
                original_text.value,

            set: (value: string) => {
                original_text.value =
                    value;
            },
        });

        /*
         * =====================================================
         * CLEAR EDITOR
         * =====================================================
         */

        function clearEditor() {
            original_text.value = "";
            currentBlankedWords.value = [];
            temporaryActiveTest.value = null;
        }

        /*
         * =====================================================
         * SET ORIGINAL TEXT
         * =====================================================
         */

        function setOriginalText(
            text: string
        ) {
            original_text.value = text;
        }

        /*
         * =====================================================
         * PARSE TEXT INTO TOKENS
         * =====================================================
         */

        function parseTextIntoTokens(
            text: string,
            blankedWords: BlankedWord[]
        ): TestToken[] {
            if (
                !text ||
                !Array.isArray(blankedWords) ||
                blankedWords.length === 0
            ) {
                return [
                    {
                        type: "text",
                        text: text || "",
                    },
                ];
            }

            const normalizedBlanks =
                blankedWords
                    .filter(
                        (blank) =>
                            !blank.is_deleted
                    )
                    .map((blank) => ({
                        id: Number(
                            blank.blank_id
                        ),

                        content:
                            blank.word_content,

                        index: Number(
                            blank.word_index
                        ),

                        group_id: Number(
                            blank.group_id
                        ),
                    }))
                    .filter(
                        (blank) =>
                            Number.isInteger(
                                blank.index
                            ) &&
                            blank.index >= 0 &&
                            blank.content.length > 0
                    )
                    .sort(
                        (a, b) =>
                            a.index -
                            b.index
                    );

            const tokens: TestToken[] = [];

            let lastIndex = 0;

            for (
                const blank of normalizedBlanks
            ) {
                // Ignore overlapping blanks
                if (
                    blank.index <
                    lastIndex
                ) {
                    continue;
                }

                //Normal text before blank
                if (
                    blank.index >
                    lastIndex
                ) {
                    tokens.push({
                        type: "text",

                        text:
                            text.slice(
                                lastIndex,
                                blank.index
                            ),
                    });
                }

                 // Blank token
                tokens.push({
                    type: "blank",

                    blank_id:
                        blank.id,

                    expected_word:
                        blank.content,

                    group_id:
                        blank.group_id,
                });

                lastIndex =
                    blank.index +
                    blank.content.length;
            }

            // Remaining text
            if (
                lastIndex <
                text.length
            ) {
                tokens.push({
                    type: "text",

                    text:
                        text.slice(
                            lastIndex
                        ),
                });
            }

            return tokens;
        }

        /*
         * =====================================================
         * TEMPORARY TEST
         * =====================================================
         */

        function setTemporaryActiveTest(
            testData: {
                title: string;
                blankedWords: BlankedWord[];
                masterColors: HighlightColor[];
                sourceText?: string;
            }
        ) {
            const blanks =
                Array.isArray(
                    testData.blankedWords
                )
                    ? testData.blankedWords
                    : [];

            currentBlankedWords.value =
                [...blanks];

            const textToParse =
                testData.sourceText ??
                original_text.value ??
                "";

            original_text.value =
                textToParse;

            const parsedTextTokens =
                parseTextIntoTokens(
                    textToParse,
                    blanks
                );

            const normalizedBlanks =
                blanks
                    .filter(
                        (blank) =>
                            !blank.is_deleted
                    )
                    .map((blank) => ({
                        ...blank,

                        colorId:
                            blank.colorId ??
                            "color-red",
                    }));

            temporaryActiveTest.value = {
                test_id: 0,

                user_id:
                    authStore.user
                        ?.user_id ??
                    null,

                title:
                    testData.title?.trim() ||
                    "Untitled Test",

                original_text:
                    textToParse,

                created_at:
                    new Date(),

                is_deleted: false,

                blanks:
                    normalizedBlanks,

                parsedTextTokens,

                masterColors:
                    testData.masterColors ||
                    [],
            };
        }

        /*
         * =====================================================
         * RESTORE TEST TO EDITOR
         * =====================================================
         */

        function restoreTestToEditor(
            testData: any
        ) {
            if (!testData) {
                return;
            }

            original_text.value =
                testData.original_text ||
                "";

            if (
                Array.isArray(
                    testData.blanks
                )
            ) {
                currentBlankedWords.value =
                    testData.blanks.map(
                        (blank: any) => ({
                            ...blank,

                            blank_id:
                                Number(
                                    blank.blank_id
                                ),

                            test_id:
                                Number(
                                    blank.test_id
                                ),

                            group_id:
                                Number(
                                    blank.group_id
                                ),

                            word_index:
                                Number(
                                    blank.word_index
                                ),
                        })
                    );
            } else {
                currentBlankedWords.value =
                    [];
            }

            temporaryActiveTest.value =
                null;
        }

        /*
         * =====================================================
         * RELOAD SAVED TEST FROM DATABASE
         * =====================================================
         */

        async function reloadTest(
            testId: number
        ) {
            if (
                !Number.isInteger(testId) ||
                testId <= 0
            ) {
                return;
            }

            if (
                temporaryActiveTest.value
            ) {
                return;
            }

            try {
                isLoading.value = true;

                const response =
                    await api.get(
                        `/tests/${testId}/blanks`
                    );

                const test =
                    response.data;

                original_text.value =
                    test.original_text ||
                    "";

                const blanks =
                    Array.isArray(
                        test.blanks
                    )
                        ? test.blanks.map(
                            (
                                blank: BlankedWord
                            ) => ({
                                ...blank,

                                blank_id:
                                    Number(
                                        blank.blank_id
                                    ),

                                test_id:
                                    Number(
                                        blank.test_id
                                    ),

                                group_id:
                                    Number(
                                        blank.group_id
                                    ),

                                word_index:
                                    Number(
                                        blank.word_index
                                    ),

                                colorId:
                                    blank.colorId ??
                                    "color-red",
                            })
                        )
                        : [];

                currentBlankedWords.value =
                    blanks;

                const existingIndex =
                    savedTests.value.findIndex(
                        (savedTest) =>
                            Number(
                                savedTest.test_id
                            ) === testId
                    );

                if (
                    existingIndex >= 0
                ) {
                    savedTests.value[
                        existingIndex
                    ] = {
                        ...savedTests.value[
                        existingIndex
                        ],

                        ...test,

                        test_id: testId,

                        blanks,

                        blankedWords:
                            blanks,

                        parsedTextTokens:
                            parseTextIntoTokens(
                                original_text.value,
                                blanks
                            ),
                    };
                }

                temporaryActiveTest.value =
                    null;

            } catch (error) {
                console.error(
                    "Failed to reload test:",
                    error
                );

                throw error;

            } finally {
                isLoading.value =
                    false;
            }
        }

        /*
         * =====================================================
         * EXTRACT TEST ID
         * =====================================================
         */

        function extractTestId(
            data: any
        ): number {
            const possibleId =
                data?.test_id ??
                data?.testId ??
                data?.data?.test_id ??
                data?.data?.testId;

            const testId =
                Number(possibleId);

            if (
                !Number.isInteger(testId) ||
                testId <= 0
            ) {
                return 0;
            }

            return testId;
        }

        /*
         * =====================================================
         * SAVE TEST WORKSPACE
         * =====================================================
         */

        async function saveTestWorkspace(
            payload: {
                title: string;
                blankedWords: BlankedWord[];
                masterColors: HighlightColor[];
            }
        ) {
            if (
                authStore.isGuest ||
                !authStore.user
            ) {
                throw new Error(
                    "Authentication required to save tests."
                );
            }

            if (!payload) {
                throw new Error(
                    "No test data was provided."
                );
            }

            const trimmedTitle =
                payload.title?.trim() ||
                "Untitled Test";

            const sourceTextValue =
                original_text.value?.trim();

            if (!sourceTextValue) {
                throw new Error(
                    "Test content is required."
                );
            }

            const activeBlanks =
                Array.isArray(
                    payload.blankedWords
                )
                    ? payload.blankedWords.filter(
                        (blank) =>
                            !blank.is_deleted
                    )
                    : [];

            if (
                activeBlanks.length === 0
            ) {
                throw new Error(
                    "A test must contain at least one blank."
                );
            }

            const formattedBlanks =
                activeBlanks.map(
                    (blank) => ({
                        group_id:
                            Number(
                                blank.group_id
                            ),

                        word_index:
                            Number(
                                blank.word_index
                            ),

                        word_content:
                            String(
                                blank.word_content
                            ),

                        description:
                            blank.description ??
                            null,
                    })
                );

            for (
                const blank of formattedBlanks
            ) {
                if (
                    !Number.isInteger(
                        blank.group_id
                    ) ||
                    blank.group_id <= 0
                ) {
                    throw new Error(
                        "One or more highlighted words have an invalid category."
                    );
                }

                if (
                    !Number.isInteger(
                        blank.word_index
                    ) ||
                    blank.word_index < 0
                ) {
                    throw new Error(
                        "One or more highlighted words have an invalid text position."
                    );
                }

                if (
                    !blank.word_content.trim()
                ) {
                    throw new Error(
                        "One or more highlighted words are empty."
                    );
                }

                if (
                    blank.description !==
                    null &&
                    typeof blank.description !==
                    "string"
                ) {
                    throw new Error(
                        "One or more blank descriptions are invalid."
                    );
                }
            }

            isLoading.value = true;

            try {
                const response =
                    await api.post(
                        "/tests",
                        {
                            title:
                                trimmedTitle,

                            original_text:
                                original_text.value,

                            blanks:
                                formattedBlanks,
                        }
                    );

                const result =
                    response?.data;

                const testId =
                    extractTestId(
                        result
                    );

                if (testId <= 0) {
                    throw new Error(
                        "Test was created but the server did not return a valid test ID."
                    );
                }

                const savedTest:
                    ClozeTest = {
                    test_id:
                        testId,

                    user_id:
                        authStore.user.user_id,

                    title:
                        trimmedTitle,

                    original_text:
                        original_text.value,

                    created_at:
                        new Date(),

                    is_deleted:
                        false,

                    blanks:
                        activeBlanks.map(
                            (blank) => ({
                                ...blank,

                                blank_id:
                                    Number(
                                        blank.blank_id
                                    ) || 0,

                                test_id:
                                    testId,

                                is_deleted:
                                    false,
                            })
                        ),

                    parsedTextTokens:
                        parseTextIntoTokens(
                            original_text.value,
                            activeBlanks
                        ),

                    blankedWords:
                        activeBlanks,
                };

                const alreadyExists =
                    savedTests.value.some(
                        (test) =>
                            Number(
                                test.test_id
                            ) === testId
                    );

                if (
                    !alreadyExists
                ) {
                    savedTests.value.push(
                        savedTest
                    );
                }

                const masterColors =
                    Array.isArray(
                        payload.masterColors
                    )
                        ? payload.masterColors
                        : [];

                activeBlanks.forEach(
                    (blank) => {
                        const color =
                            masterColors.find(
                                (item) =>
                                    item.id ===
                                    blank.colorId
                            );

                        const groupId =
                            Number(
                                blank.group_id
                            );

                        const wordEntry:
                            LibraryEntry = {
                            blank_id:
                                Number(
                                    blank.blank_id
                                ),

                            test_id:
                                testId,

                            word_content:
                                blank.word_content,

                            description:
                                blank.description,

                            group_id:
                                groupId,

                            color_hex:
                                color?.hex ??
                                "#c3cedb",

                            group_label:
                                color?.name ??
                                "Unlabeled",

                            saved_at:
                                new Date(),
                        };

                        wordLibrary.value.push(
                            wordEntry
                        );
                    }
                );

                temporaryActiveTest.value =
                    null;

                return {
                    ...result,

                    test_id:
                        testId,
                };

            } catch (error: any) {
                console.error(
                    "Failed to save test:",
                    error
                );

                console.error(
                    "HTTP STATUS:",
                    error?.response?.status
                );

                console.error(
                    "HTTP DATA:",
                    error?.response?.data
                );

                throw error;

            } finally {
                isLoading.value =
                    false;
            }
        }

        return {
            original_text,

            sourceText,

            currentBlankedWords,

            savedTests,

            wordLibrary,

            isLoading,

            temporaryActiveTest,

            setOriginalText,

            saveTestWorkspace,

            setTemporaryActiveTest,

            parseTextIntoTokens,

            restoreTestToEditor,

            reloadTest,

            clearEditor,
        };
    }
);
