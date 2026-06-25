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
    user_id: number | null; // Nullable for anonymous users
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

export interface TestAttempt {
    attempt_id: number;
    user_id: number | null;
    test_id: number;
    score: number;
    completed_at: Date;
}

export interface TestWithBlanks extends Test {
    blanks: Blank[];
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        user_id: number;
        username: string;
        display_name: string;
    };
}