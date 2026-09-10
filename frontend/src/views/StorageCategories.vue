<script setup lang="ts">
import {
    ref,
    onMounted
} from 'vue';

import { useRouter } from 'vue-router';
import { api } from '../services/api';

import type { Group } from '../../../shared/types';

const router = useRouter();

const groups = ref<Group[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const editingGroupId = ref<number | null>(null);
const editingName = ref('');
const editingColor = ref('#c3cedb');

const isSaving = ref(false);
const deletingGroupId = ref<number | null>(null);

async function loadGroups() {
    try {
        isLoading.value = true;
        error.value = null;

        const response = await api.get('/groups/my');

        groups.value = response.data.filter(
            (group: Group) =>
                !group.is_deleted
        );
    } catch (err) {
        console.error(
            'Failed to load categories:',
            err
        );

        error.value =
            'Could not load your categories.';
    } finally {
        isLoading.value = false;
    }
}

onMounted(loadGroups);

const openCategory = (groupId: number) => {
    router.push(
        `/storage/categories/${groupId}`
    );
};

function startEditing(group: Group) {
    editingGroupId.value = group.group_id;
    editingName.value = group.name;
    editingColor.value =
        group.color_hex || '#c3cedb';
}

function cancelEditing() {
    editingGroupId.value = null;
    editingName.value = '';
    editingColor.value = '#c3cedb';
}

async function saveGroup(group: Group) {
    const name = editingName.value.trim();

    if (!name) {
        error.value =
            'Category name cannot be empty.';
        return;
    }

    try {
        isSaving.value = true;
        error.value = null;

        await api.put(
            `/groups/${group.group_id}`,
            {
                name,
                color_hex: editingColor.value
            }
        );

        group.name = name;
        group.color_hex = editingColor.value;

        cancelEditing();
    } catch (err) {
        console.error(
            'Failed to update category:',
            err
        );

        error.value =
            'Could not update the category.';
    } finally {
        isSaving.value = false;
    }
}

async function deleteGroup(group: Group) {
    const confirmed = window.confirm(
        `Delete "${group.name}"?\n\nThe category will be removed from your storage.`
    );

    if (!confirmed) {
        return;
    }

    try {
        deletingGroupId.value =
            group.group_id;

        error.value = null;

        await api.delete(
            `/groups/${group.group_id}`
        );

        groups.value =
            groups.value.filter(
                (item) =>
                    item.group_id !==
                    group.group_id
            );

        if (
            editingGroupId.value ===
            group.group_id
        ) {
            cancelEditing();
        }
    } catch (err) {
        console.error(
            'Failed to delete category:',
            err
        );

        error.value =
            'Could not delete the category.';
    } finally {
        deletingGroupId.value = null;
    }
}
</script>

<template>
    <div class="storage-page">

        <button class="back-button" @click="router.push('/storage')" type="button">
            ← Storage
        </button>

        <h1>Categories</h1>

        <p class="description">
            Your global categories. Open one
            to see every word saved inside it.
        </p>

        <div v-if="isLoading" class="message">
            Loading categories...
        </div>

        <div v-else-if="error" class="message error">
            {{ error }}
        </div>

        <div v-else-if="groups.length === 0" class="message">
            You haven't created any categories yet.
        </div>

        <div v-else class="category-grid">

            <div v-for="group in groups" :key="group.group_id" class="category-card">

                <div class="category-color" :style="{
                    backgroundColor:
                        group.color_hex
                }"></div>

                <button class="card-main" @click="
                    openCategory(
                        group.group_id
                    )
                    " type="button">
                    <div class="folder-icon">
                        📂
                    </div>

                    <div class="category-info">
                        <h2>
                            {{ group.name }}
                        </h2>

                        <p>
                            Open category
                        </p>
                    </div>
                </button>

                <!-- EDIT MODE -->
                <div v-if="
                    editingGroupId ===
                    group.group_id
                " class="edit-panel" @click.stop>
                    <label>
                        Name

                        <input v-model="editingName" type="text" maxlength="100" @keyup.enter="
                            saveGroup(group)
                            " />
                    </label>

                    <label>
                        Color

                        <div class="color-row">
                            <input v-model="editingColor" type="color" />

                            <span>
                                {{ editingColor }}
                            </span>
                        </div>
                    </label>

                    <div class="edit-actions">

                        <button class="save-button" type="button" :disabled="isSaving" @click="
                            saveGroup(group)
                            ">
                            {{
                                isSaving
                                    ? 'Saving...'
                                    : 'Save'
                            }}
                        </button>

                        <button class="cancel-button" type="button" :disabled="isSaving" @click="cancelEditing">
                            Cancel
                        </button>

                    </div>
                </div>

                <!-- NORMAL ACTIONS -->
                <div v-else class="card-actions">
                    <button class="edit-button" type="button" @click.stop="
                        startEditing(group)
                        ">
                        Edit
                    </button>

                    <button class="delete-button" type="button" :disabled="deletingGroupId ===
                        group.group_id
                        " @click.stop="
                            deleteGroup(group)
                            ">
                        {{
                            deletingGroupId ===
                                group.group_id
                                ? 'Deleting...'
                                : 'Delete'
                        }}
                    </button>
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

h1 {
    margin-bottom: 8px;
}

.description {
    color: #666;
    margin-bottom: 30px;
}

.category-grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
}

.category-card {
    position: relative;
    background: white;
    border: 1px solid #ddd;
    border-radius: 10px;
    overflow: hidden;
    transition:
        border-color 0.15s ease,
        box-shadow 0.15s ease;
}

.category-card:hover {
    border-color: #aaa;
    box-shadow:
        0 4px 15px rgba(0, 0, 0, 0.08);
}

.category-color {
    width: 5px;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
}

.card-main {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 22px 22px 15px 27px;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
}

.folder-icon {
    font-size: 30px;
}

.category-info {
    min-width: 0;
}

.category-info h2 {
    margin: 0 0 5px;
    font-size: 18px;
    word-break: break-word;
}

.category-info p {
    margin: 0;
    color: #777;
}

.card-actions {
    display: flex;
    gap: 8px;
    padding:
        0 22px 18px 27px;
}

.card-actions button {
    padding: 7px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
}

.edit-button {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #374151;
}

.edit-button:hover {
    background: #e5e7eb;
}

.delete-button {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #dc2626;
}

.delete-button:hover {
    background: #ffe4e6;
}

.delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.edit-panel {
    padding:
        0 22px 20px 27px;
}

.edit-panel label {
    display: block;
    margin-bottom: 12px;
    color: #444;
    font-size: 13px;
    font-weight: 600;
}

.edit-panel input[type="text"] {
    display: block;
    width: 100%;
    box-sizing: border-box;
    margin-top: 5px;
    padding: 9px 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font: inherit;
}

.color-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 5px;
}

.color-row input[type="color"] {
    width: 42px;
    height: 34px;
    padding: 2px;
    border: 1px solid #ccc;
    border-radius: 6px;
    cursor: pointer;
}

.color-row span {
    color: #777;
    font-family: monospace;
}

.edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 15px;
}

.edit-actions button {
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
}

.save-button {
    background: #2563eb;
    color: white;
    border: 1px solid #2563eb;
}

.save-button:hover {
    background: #1d4ed8;
}

.save-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.cancel-button {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
}

.cancel-button:hover {
    background: #e5e7eb;
}

.message {
    padding: 30px;
    color: #666;
}

.error {
    color: #dc2626;
}
</style>
