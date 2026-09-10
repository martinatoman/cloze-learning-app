<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const openTests = () => {
    router.push('/storage/tests');
};

const openCategories = () => {
    router.push('/storage/categories');
};

const openWords = () => {
    router.push('/storage/words');
};
</script>

<template>
    <div class="storage-page">

        <div class="storage-header">
            <h1>Storage</h1>

            <p>
                Manage your saved tests, categories,
                and words.
            </p>
        </div>


        <div class="storage-grid">

            <button class="storage-card" @click="openTests" type="button">
                <div class="card-icon">
                    📝
                </div>

                <div>
                    <h2>Tests</h2>

                    <p>
                        View all of your saved
                        cloze tests.
                    </p>
                </div>
            </button>


            <button class="storage-card" @click="openCategories" type="button">
                <div class="card-icon">
                    📂
                </div>

                <div>
                    <h2>Categories</h2>

                    <p>
                        Open categories and view
                        the words inside them.
                    </p>
                </div>
            </button>


            <button class="storage-card" @click="openWords" type="button">
                <div class="card-icon">
                    🔤
                </div>

                <div>
                    <h2>Words</h2>

                    <p>
                        Browse every saved word,
                        organized by category.
                    </p>
                </div>
            </button>

        </div>

    </div>
</template>

<style scoped>
.storage-page {
    padding: 40px;
    max-width: 1100px;
    margin: 0 auto;
}

.storage-header h1 {
    margin: 0 0 8px;
}

.storage-header p {
    color: #666;
    margin-bottom: 35px;
}

.storage-grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.storage-card {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    padding: 25px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
    transition:
        transform 0.15s,
        box-shadow 0.15s;
}

.storage-card:hover {
    transform: translateY(-2px);
    box-shadow:
        0 5px 20px rgba(0, 0, 0, 0.1);
}

.card-icon {
    font-size: 32px;
}

.storage-card h2 {
    margin: 0 0 8px;
}

.storage-card p {
    margin: 0;
    color: #666;
    line-height: 1.5;
}
</style>