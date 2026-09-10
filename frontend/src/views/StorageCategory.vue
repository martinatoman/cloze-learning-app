<script setup lang="ts">
import {
    ref,
    computed,
    onMounted
} from 'vue';

import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api';

import type {
    Group,
    BlankedWord
} from '../../../shared/types';

const route = useRoute();
const router = useRouter();

const group = ref<Group | null>(null);
const words = ref<BlankedWord[]>([]);

const isLoading = ref(true);
const error = ref<string | null>(null);

const groupId = computed(() =>
    Number(route.params.group_id)
);

onMounted(async () => {
    try {
        const [
            groupResponse,
            blanksResponse
        ] = await Promise.all([
            api.get(
                `/groups/${groupId.value}`
            ),
            api.get(
                `/blanks/group/${groupId.value}`
            )
        ]);

        group.value =
            groupResponse.data;

        words.value =
            blanksResponse.data.filter(
                (word: BlankedWord) =>
                    !word.is_deleted
            );
    } catch (err) {
        console.error(
            'Failed to load category:',
            err
        );

        error.value =
            'Could not load this category.';
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <div class="storage-page">

        <button class="back-button" @click="
            router.push(
                '/storage/categories'
            )
            " type="button">
            ← Categories
        </button>


        <div v-if="group" class="category-header">
            <div class="category-color" :style="{
                backgroundColor:
                    group.color_hex
            }"></div>

            <div class="folder-icon">
                📂
            </div>

            <div>
                <h1>
                    {{ group.name }}
                </h1>

                <p>
                    {{ words.length }}
                    saved
                    {{
                        words.length === 1
                            ? 'word'
                            : 'words'
                    }}
                </p>
            </div>
        </div>


        <div v-if="isLoading" class="message">
            Loading words...
        </div>


        <div v-else-if="error" class="message error">
            {{ error }}
        </div>


        <div v-else-if="words.length === 0" class="message">
            There are no saved words in this
            category yet.
        </div>


        <div v-else class="word-grid">
            <div v-for="word in words" :key="word.blank_id" class="word-card">
                <div class="word-content">
                    {{ word.word_content }}
                </div>

                <div v-if="word.description" class="word-description">
                    {{ word.description }}
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
    margin-bottom: 25px;
    font-size: 15px;
}

.category-header {
    position: relative;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 25px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 30px;
}

.category-color {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 7px;
}

.folder-icon {
    font-size: 38px;
    margin-left: 8px;
}

.category-header h1 {
    margin: 0 0 5px;
}

.category-header p {
    margin: 0;
    color: #666;
}

.word-grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
}

.word-card {
    padding: 18px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
}

.word-content {
    font-weight: 600;
    font-size: 17px;
}

.word-description {
    margin-top: 8px;
    color: #666;
    font-size: 14px;
}

.message {
    padding: 30px;
    color: #666;
}

.error {
    color: #dc2626;
}
</style>