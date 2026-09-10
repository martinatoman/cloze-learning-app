<script setup lang="ts">
import {
    ref,
    computed,
    onMounted
} from 'vue';

import { useRouter } from 'vue-router';
import { api } from '../services/api';

import type {
    ClozeTest,
    BlankedWord,
    Group
} from '../../../shared/types';

const router = useRouter();

const tests = ref<ClozeTest[]>([]);
const groups = ref<Group[]>([]);
const words = ref<BlankedWord[]>([]);

const isLoading = ref(true);
const error = ref<string | null>(null);

const editingWordId = ref<number | null>(null);
const editingWord = ref('');
const editingDescription = ref('');
const editingGroupId = ref<number>(0);
const isSaving = ref(false);


/*
 * =====================================================
 * LOAD
 * =====================================================
 */

onMounted(async () => {
    await loadWords();
});

async function loadWords() {
    try {
        isLoading.value = true;
        error.value = null;

        const [
            testsResponse,
            groupsResponse
        ] = await Promise.all([
            api.get('/tests/my'),
            api.get('/groups/my')
        ]);

        tests.value =
            testsResponse.data;

        groups.value =
            groupsResponse.data.filter(
                (group: Group) =>
                    !group.is_deleted
            );


        const blankRequests =
            tests.value.map(
                (test) =>
                    api.get(
                        `/blanks/test/${test.test_id}`
                    )
            );

        const blankResponses =
            await Promise.all(
                blankRequests
            );

        words.value =
            blankResponses
                .flatMap(
                    (response) =>
                        response.data
                )
                .filter(
                    (word: BlankedWord) =>
                        !word.is_deleted
                );

    } catch (err) {
        console.error(
            'Failed to load words:',
            err
        );

        error.value =
            'Could not load your words.';
    } finally {
        isLoading.value = false;
    }
}


/*
 * =====================================================
 * GROUPING
 * =====================================================
 */

const wordsByGroup = computed(() => {
    const result:
        Record<number, BlankedWord[]> = {};

    for (const word of words.value) {
        const groupId =
            Number(word.group_id);

        if (!result[groupId]) {
            result[groupId] = [];
        }

        result[groupId].push(word);
    }

    return result;
});

const ungroupedWords = computed(() => {
    return words.value.filter(
        (word) =>
            !word.group_id ||
            Number(word.group_id) === 0
    );
});

const getWordsForGroup = (
    groupId: number
) => {
    return wordsByGroup.value[groupId] || [];
};


/*
 * =====================================================
 * CATEGORY
 * =====================================================
 */

const openCategory = (
    groupId: number
) => {
    router.push(
        `/storage/categories/${groupId}`
    );
};


/*
 * =====================================================
 * EDIT WORD
 * =====================================================
 */

function startEditing(
    word: BlankedWord
) {
    editingWordId.value =
        word.blank_id;

    editingWord.value =
        word.word_content;

    editingDescription.value =
        word.description ?? '';

    editingGroupId.value =
        Number(word.group_id) || 0;
}

function cancelEditing() {
    editingWordId.value = null;
    editingWord.value = '';
    editingDescription.value = '';
    editingGroupId.value = 0;
}

async function saveWord(
    word: BlankedWord
) {
    const content =
        editingWord.value.trim();

    if (!content) {
        alert(
            'Word content cannot be empty.'
        );
        return;
    }

    try {
        isSaving.value = true;

        const response =
            await api.put(
                `/blanks/${word.blank_id}`,
                {
                    word_content:
                        content,

                    description:
                        editingDescription.value.trim() ||
                        null,

                    group_id:
                        editingGroupId.value
                }
            );

        console.log(
            'Updated word:',
            response.data
        );

        word.word_content =
            content;

        word.description =
            editingDescription.value.trim() ||
            null;

        word.group_id =
            editingGroupId.value;

        cancelEditing();

    } catch (err) {
        console.error(
            'Failed to update word:',
            err
        );

        alert(
            'Could not update the word.'
        );
    } finally {
        isSaving.value = false;
    }
}


/*
 * =====================================================
 * DELETE WORD
 * =====================================================
 */

async function deleteWord(
    word: BlankedWord
) {
    const confirmed =
        window.confirm(
            `Delete "${word.word_content}"?`
        );

    if (!confirmed) {
        return;
    }

    try {
        await api.delete(
            `/blanks/${word.blank_id}`
        );

        words.value =
            words.value.filter(
                (item) =>
                    item.blank_id !==
                    word.blank_id
            );

    } catch (err) {
        console.error(
            'Failed to delete word:',
            err
        );

        alert(
            'Could not delete the word.'
        );
    }
}
</script>

<template>
    <div class="storage-page">

        <button class="back-button" @click="router.push('/storage')" type="button">
            ← Storage
        </button>

        <h1>Words</h1>

        <p class="description">
            All saved words organized by
            category.
        </p>


        <div v-if="isLoading" class="message">
            Loading words...
        </div>


        <div v-else-if="error" class="message error">
            {{ error }}
        </div>


        <div v-else-if="words.length === 0" class="message">
            You haven't saved any words yet.
        </div>


        <template v-else>

            <!-- CATEGORIES -->

            <section v-for="group in groups" :key="group.group_id" class="word-section">

                <button class="section-header" @click="
                    openCategory(
                        group.group_id
                    )
                    " type="button">
                    <span class="category-dot" :style="{
                        backgroundColor:
                            group.color_hex
                    }"></span>

                    <span class="category-name">
                        {{ group.name }}
                    </span>

                    <span class="word-count">
                        {{
                            getWordsForGroup(
                                group.group_id
                            ).length
                        }}
                        {{
                            getWordsForGroup(
                                group.group_id
                            ).length === 1
                                ? 'word'
                                : 'words'
                        }}
                    </span>
                </button>


                <div v-if="
                    getWordsForGroup(
                        group.group_id
                    ).length > 0
                " class="word-grid">

                    <div v-for="
word in
                                getWordsForGroup(
                                    group.group_id
                                )
                        " :key="word.blank_id" class="word-card">

                        <!-- NORMAL -->

                        <template v-if="
                            editingWordId !==
                            word.blank_id
                        ">
                            <div class="word-content">
                                <div class="word-text">
                                    {{ word.word_content }}
                                </div>

                                <div v-if="word.description" class="word-description">
                                    {{
                                        word.description
                                    }}
                                </div>
                            </div>

                            <div class="word-actions">
                                <button class="action-button" type="button" @click="
                                    startEditing(
                                        word
                                    )
                                    ">
                                    Edit
                                </button>

                                <button class="action-button delete" type="button" @click="
                                    deleteWord(
                                        word
                                    )
                                    ">
                                    Delete
                                </button>
                            </div>
                        </template>


                        <!-- EDITING -->

                        <template v-else>

                            <input v-model="editingWord" class="edit-input" placeholder="Word" />

                            <input v-model="editingDescription
                                " class="edit-input" placeholder="Description" />

                            <select v-model.number="editingGroupId
                                " class="edit-input">
                                <option :value="0">
                                    Uncategorized
                                </option>

                                <option v-for="
availableGroup
                                            in groups
                                    " :key="availableGroup.group_id
                                        " :value="availableGroup.group_id
                                        ">
                                    {{
                                        availableGroup.name
                                    }}
                                </option>
                            </select>

                            <div class="word-actions">

                                <button class="action-button save" type="button" :disabled="isSaving
                                    " @click="
                                        saveWord(
                                            word
                                        )
                                        ">
                                    {{
                                        isSaving
                                            ? 'Saving...'
                                            : 'Save'
                                    }}
                                </button>

                                <button class="action-button" type="button" :disabled="isSaving
                                    " @click="
                                        cancelEditing()
                                        ">
                                    Cancel
                                </button>

                            </div>

                        </template>

                    </div>

                </div>

            </section>


            <!-- UNGROUPED -->

            <section v-if="
                ungroupedWords.length > 0
            " class="word-section">

                <div class="section-header ungrouped">
                    <span class="category-name">
                        Uncategorized
                    </span>

                    <span class="word-count">
                        {{
                            ungroupedWords.length
                        }}
                        {{
                            ungroupedWords.length === 1
                                ? 'word'
                                : 'words'
                        }}
                    </span>
                </div>


                <div class="word-grid">

                    <div v-for="
word in ungroupedWords
                        " :key="word.blank_id" class="word-card">

                        <template v-if="
                            editingWordId !==
                            word.blank_id
                        ">
                            <div class="word-content">
                                <div class="word-text">
                                    {{ word.word_content }}
                                </div>

                                <div v-if="
                                    word.description
                                " class="word-description">
                                    {{
                                        word.description
                                    }}
                                </div>
                            </div>

                            <div class="word-actions">

                                <button class="action-button" type="button" @click="
                                    startEditing(
                                        word
                                    )
                                    ">
                                    Edit
                                </button>

                                <button class="action-button delete" type="button" @click="
                                    deleteWord(
                                        word
                                    )
                                    ">
                                    Delete
                                </button>

                            </div>
                        </template>


                        <template v-else>

                            <input v-model="editingWord" class="edit-input" placeholder="Word" />

                            <input v-model="editingDescription
                                " class="edit-input" placeholder="Description" />

                            <select v-model.number="editingGroupId
                                " class="edit-input">
                                <option :value="0">
                                    Uncategorized
                                </option>

                                <option v-for="
availableGroup
                                            in groups
                                    " :key="availableGroup.group_id
                                        " :value="availableGroup.group_id
                                        ">
                                    {{
                                        availableGroup.name
                                    }}
                                </option>
                            </select>

                            <div class="word-actions">

                                <button class="action-button save" type="button" :disabled="isSaving
                                    " @click="
                                        saveWord(
                                            word
                                        )
                                        ">
                                    {{
                                        isSaving
                                            ? 'Saving...'
                                            : 'Save'
                                    }}
                                </button>

                                <button class="action-button" type="button" :disabled="isSaving
                                    " @click="
                                        cancelEditing()
                                        ">
                                    Cancel
                                </button>

                            </div>

                        </template>

                    </div>

                </div>

            </section>

        </template>

    </div>
</template>

<style scoped>
.storage-page {
    padding: 40px;
    max-width: 1100px;
    margin: 0 auto;
}

.back-button {
    border: none;
    background: none;
    padding: 0;
    color: #3b82f6;
    cursor: pointer;
    margin-bottom: 15px;
    font-size: 15px;
}

h1 {
    margin-bottom: 8px;
}

.description {
    color: #666;
    margin-bottom: 35px;
}

.word-section {
    margin-bottom: 40px;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 0;
    margin-bottom: 15px;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    font: inherit;
}

.section-header:hover .category-name {
    text-decoration: underline;
}

.category-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.category-name {
    font-size: 20px;
    font-weight: 600;
}

.word-count {
    color: #777;
    font-size: 14px;
    margin-left: auto;
}

.word-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.word-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 180px;
    max-width: 280px;
    padding: 12px 15px;
    border: 1px solid #d5d5d5;
    border-radius: 8px;
    background: white;
}

.word-content {
    flex: 1;
}

.word-text {
    font-size: 15px;
    font-weight: 500;
}

.word-description {
    margin-top: 5px;
    color: #777;
    font-size: 13px;
}

.word-actions {
    display: flex;
    gap: 6px;
}

.action-button {
    border: 1px solid #ddd;
    background: white;
    border-radius: 6px;
    padding: 6px 9px;
    cursor: pointer;
    font-size: 12px;
}

.action-button:hover {
    background: #f5f5f5;
}

.action-button.save {
    color: #15803d;
    border-color: #86efac;
}

.action-button.delete {
    color: #dc2626;
    border-color: #fecaca;
}

.action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.edit-input {
    width: 100%;
    box-sizing: border-box;
    padding: 7px 9px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 14px;
}

.ungrouped {
    cursor: default;
}

.message {
    padding: 30px;
    color: #666;
}

.error {
    color: #dc2626;
}
</style>
