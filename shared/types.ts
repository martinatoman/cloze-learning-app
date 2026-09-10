// --- Database & Backend ---
export interface User {
    user_id: number;
    username: string;
    display_name: string;
    password_hash: string;
    total_xp: number;
}

export interface Group {
    group_id: number;
    user_id: number;
    name: string;
    color_hex: string;
    is_deleted: boolean;
}

export interface Test {
    test_id: number;
    user_id: number | null;
    title: string;
    original_text: string;
    created_at: Date;
    is_deleted: boolean;
}

export interface Blank {
    blank_id: number;
    test_id: number;
    group_id: number;
    word_index: number;
    word_content: string;
    description: string | null;
    is_deleted: boolean;
}

export interface CreateBlank {
    test_id?: number;
    group_id: number;
    word_index: number;
    word_content: string;
    description: string | null;
}

export interface TestAttempt {
    attempt_id: number;
    user_id: number | null;
    test_id: number;
    score: number;
    completed_at: Date;
}

export interface TestWithBlanks extends Test {
    blanks: Blank[];
    parsedTextTokens?: TestToken[];
    blankedWords?: BlankedWord[];
}

// --- Frontend ---
export type ClozeTest = TestWithBlanks;

export interface HighlightColor {
    id: string; // e.g. 'color-red'
    name: string;
    hex: string;
}

export interface TestTokenText {
    type: "text";
    text: string;
}

export interface TestTokenBlank {
    type: "blank";
    blank_id: number;
    expected_word: string;
    group_id: number;
}

export type TestToken =
    | TestTokenText
    | TestTokenBlank;

export type BlankedWord = Blank & {
    // Frontend only
    colorId?: string;
};

export interface LibraryEntry {
    blank_id: number;
    word_content: string;
    description?: string | null;
    group_id: number;
    color_hex: string;
    group_label: string;
    test_id: number;
    saved_at: Date;
}