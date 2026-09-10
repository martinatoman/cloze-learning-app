<script setup lang="ts">
import {
    ref,
    onMounted
} from 'vue';

import { useRouter } from 'vue-router';
import { api } from '../services/api';

import type { ClozeTest } from '../../../shared/types';

const router = useRouter();

const tests = ref<ClozeTest[]>([]);

const isLoading = ref(true);
const error = ref<string | null>(null);

const editingTestId = ref<number | null>(null);
const editingTitle = ref('');

const isSaving = ref(false);
const deletingTestId = ref<number | null>(null);

/*
 * =====================================================
 * LOAD TESTS
 * =====================================================
 */

async function loadTests() {
    isLoading.value = true;
    error.value = null;

    try {
        const response =
            await api.get('/tests/my');

        tests.value =
            response.data.filter(
                (test: ClozeTest) =>
                    !test.is_deleted
            );
    } catch (err) {
        console.error(
            'Failed to load tests:',
            err
        );

        error.value =
            'Could not load your tests.';
    } finally {
        isLoading.value = false;
    }
}

/*
 * =====================================================
 * MOUNT
 * =====================================================
 */

onMounted(() => {
    loadTests();
});

/*
 * =====================================================
 * OPEN TEST
 * =====================================================
 */

function openTest(testId: number) {
    router.push(
        `/test?test_id=${testId}`
    );
}

/*
 * =====================================================
 * START EDIT
 * =====================================================
 */

function startEditing(test: ClozeTest) {
    editingTestId.value =
        test.test_id;

    editingTitle.value =
        test.title;
}

/*
 * =====================================================
 * CANCEL EDIT
 * =====================================================
 */

function cancelEditing() {
    editingTestId.value = null;
    editingTitle.value = '';
}

/*
 * =====================================================
 * SAVE TEST TITLE
 * =====================================================
 */

async function saveTestTitle(
    test: ClozeTest
) {
    const title =
        editingTitle.value.trim();

    if (!title) {
        alert(
            'Test title cannot be empty.'
        );
        return;
    }

    isSaving.value = true;

    try {
        await api.put(
            `/tests/${test.test_id}`,
            {
                title
            }
        );

        test.title = title;

        cancelEditing();
    } catch (err) {
        console.error(
            'Failed to rename test:',
            err
        );

        alert(
            'Could not rename the test.'
        );
    } finally {
        isSaving.value = false;
    }
}

/*
 * =====================================================
 * DELETE TEST
 * =====================================================
 */

async function deleteTest(
    test: ClozeTest
) {
    const confirmed =
        window.confirm(
            `Delete "${test.title}"? This cannot be undone.`
        );

    if (!confirmed) {
        return;
    }

    deletingTestId.value =
        test.test_id;

    try {
        await api.delete(
            `/tests/${test.test_id}`
        );

        tests.value =
            tests.value.filter(
                (item) =>
                    item.test_id !==
                    test.test_id
            );
    } catch (err) {
        console.error(
            'Failed to delete test:',
            err
        );

        alert(
            'Could not delete the test.'
        );
    } finally {
        deletingTestId.value = null;
    }
}
</script>

<template>
    <div class="storage-page">

        <div class="page-header">

            <div>
                <button class="back-button" @click="
                    router.push('/storage')
                    " type="button">
                    ← Storage
                </button>

                <h1>Tests</h1>

                <p>
                    All of your saved tests.
                </p>
            </div>

        </div>


        <!-- LOADING -->

        <div v-if="isLoading" class="message">
            Loading tests...
        </div>


        <!-- ERROR -->

        <div v-else-if="error" class="message error">
            {{ error }}
        </div>


        <!-- EMPTY -->

        <div v-else-if="tests.length === 0" class="message">
            You haven't saved any tests yet.
        </div>


        <!-- TESTS -->

        <div v-else class="test-grid">

            <div v-for="test in tests" :key="test.test_id" class="test-card">

                <!-- OPEN TEST -->

                <button class="test-main" @click="
                    openTest(
                        test.test_id
                    )
                    " type="button">

                    <div class="test-icon">
                        📝
                    </div>

                    <div class="test-info">

                        <h2>
                            {{ test.title }}
                        </h2>

                        <p>
                            {{
                                test.created_at
                                    ? new Date(
                                        test.created_at
                                    ).toLocaleDateString()
                                    : ''
                            }}
                        </p>

                    </div>

                </button>


                <!-- ACTIONS -->

                <div class="test-actions">

                    <button class="action-button edit-button" @click.stop="
                        startEditing(test)
                        " type="button">
                        Rename
                    </button>

                    <button class="action-button delete-button" @click.stop="
                        deleteTest(test)
                        " :disabled="deletingTestId ===
                            test.test_id
                            " type="button">
                        {{
                            deletingTestId ===
                                test.test_id
                                ? 'Deleting...'
                                : 'Delete'
                        }}
                    </button>

                </div>


                <!-- EDIT PANEL -->

                <div v-if="
                    editingTestId ===
                    test.test_id
                " class="edit-panel" @click.stop>

                    <input v-model="editingTitle
                        " class="title-input" type="text" maxlength="255" @keyup.enter="
                            saveTestTitle(test)
                            " @keyup.escape="
                            cancelEditing()
                            " />

                    <div class="edit-actions">

                        <button class="save-button" @click="
                            saveTestTitle(test)
                            " :disabled="isSaving" type="button">
                            {{
                                isSaving
                                    ? 'Saving...'
                                    : 'Save'
                            }}
                        </button>

                        <button class="cancel-button" @click="
                            cancelEditing()
                            " :disabled="isSaving" type="button">
                            Cancel
                        </button>

                    </div>

                </div>

            </div>

        </div>

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

.page-header h1 {
    margin: 0 0 8px;
}

.page-header p {
    color: #666;
    margin-bottom: 30px;
}

.test-grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
}

.test-card {
    position: relative;
    background: white;
    border: 1px solid #ddd;
    border-radius: 10px;
    overflow: hidden;
}

.test-card:hover {
    border-color: #3b82f6;
    box-shadow:
        0 4px 15px rgba(0, 0, 0, 0.08);
}

.test-main {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 22px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
}

.test-icon {
    font-size: 30px;
    flex-shrink: 0;
}

.test-info {
    min-width: 0;
}

.test-info h2 {
    margin: 0 0 6px;
    font-size: 18px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.test-info p {
    margin: 0;
    color: #777;
}

.test-actions {
    display: flex;
    gap: 8px;
    padding:
        0 18px 18px 18px;
}

.action-button {
    padding: 7px 12px;
    border-radius: 6px;
    border: 1px solid #ddd;
    background: #f8f8f8;
    cursor: pointer;
    font-size: 13px;
}

.action-button:hover {
    background: #eee;
}

.edit-button {
    color: #2563eb;
}

.delete-button {
    color: #dc2626;
}

.delete-button:hover {
    background: #fef2f2;
}

.action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.edit-panel {
    padding:
        0 18px 18px 18px;
}

.title-input {
    width: 100%;
    box-sizing: border-box;
    padding: 9px 11px;
    border: 1px solid #bbb;
    border-radius: 6px;
    font-size: 15px;
    outline: none;
}

.title-input:focus {
    border-color: #3b82f6;
    box-shadow:
        0 0 0 2px rgba(59, 130, 246, 0.1);
}

.edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 9px;
}

.save-button,
.cancel-button {
    padding: 7px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
}

.save-button {
    border: none;
    background: #2563eb;
    color: white;
}

.save-button:hover {
    background: #1d4ed8;
}

.cancel-button {
    border: 1px solid #ddd;
    background: white;
    color: #555;
}

.cancel-button:hover {
    background: #f5f5f5;
}

.save-button:disabled,
.cancel-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.message {
    padding: 30px;
    color: #666;
}

.error {
    color: #dc2626;
}
</style>