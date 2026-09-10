export interface HighlightColor {
    id: string; // Used for frontend color picker tabs ('color-red')
    name: string;
    hex: string;
}

export interface BlankedWord {
    blank_id: number;
    test_id: number;
    group_id: number;
    word_index: number;
    word_content: string;
    description?: string;
    colorId?: string; // Optional temporary map for frontend brush picker
}

export interface WordGroup {
    group_id: number;
    user_id: number;
    name: string;
    color_hex: string;
}

export interface ClozeTest {
    test_id: number;
    user_id: number;
    title: string;
    original_text: string;
    created_at: Date;
}

export type TestToken =
    | { type: 'text'; text: string }
    | { type: 'blank'; blank_id: number; expected_word: string; group_id: number };

export interface LibraryEntry {
    blank_id: number;
    word_content: string;
    description?: string;
    group_id: number;
    color_hex: string;
    group_label: string;
    test_id: number;
    saved_at: Date;
}