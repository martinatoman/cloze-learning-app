<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

defineProps<{
    isCollapsed: boolean;
}>();

defineEmits<{
    (event: 'toggle'): void;
}>();

const router = useRouter();
const route = useRoute();

const isStorageOpen = ref(
    route.path.startsWith('/storage')
);

const toggleStorage = () => {
    isStorageOpen.value = !isStorageOpen.value;
};

const goHome = () => {
    router.push('/');
};

const goToEditor = () => {
    router.push('/editor');
};

const goToStorage = () => {
    router.push('/storage');
};

const goToTests = () => {
    router.push('/storage/tests');
};

const goToCategories = () => {
    router.push('/storage/categories');
};

const goToWords = () => {
    router.push('/storage/words');
};

const isActive = (path: string) => {
    return route.path === path;
};

const isStorageSectionActive = () => {
    return route.path.startsWith('/storage');
};
</script>

<template>
    <div class="sidebar">
        <div class="sidebar-header">
            <h3 v-if="!isCollapsed">
                Cloze Test
            </h3>

            <button @click="$emit('toggle')" class="toggle-btn" type="button">
                ☰
            </button>
        </div>

        <nav class="sidebar-nav">

            <!-- HOME -->
            <button class="nav-item" :class="{ active: isActive('/') }" @click="goHome" type="button">
                <span class="icon">🏠</span>

                <span v-if="!isCollapsed" class="text">
                    Home
                </span>
            </button>

            <!-- CREATE TEST -->
            <button class="nav-item" :class="{ active: isActive('/editor') }" @click="goToEditor" type="button">
                <span class="icon">✏️</span>

                <span v-if="!isCollapsed" class="text">
                    Create Test
                </span>
            </button>

            <!-- STORAGE -->
            <div class="storage-section">

                <div class="storage-row">

                    <!-- CLICKING STORAGE OPENS STORAGE -->
                    <button class="nav-item storage-main" :class="{
                        active:
                            isStorageSectionActive()
                    }" @click="goToStorage" type="button">
                        <span class="icon">
                            📁
                        </span>

                        <span v-if="!isCollapsed" class="text">
                            Storage
                        </span>
                    </button>


                    <!-- ARROW -->
                    <button v-if="!isCollapsed" class="storage-toggle" @click="toggleStorage" type="button">
                        {{ isStorageOpen ? '▾' : '▸' }}
                    </button>

                </div>


                <!-- STORAGE CHILDREN -->
                <div v-if="
                    !isCollapsed &&
                    isStorageOpen
                " class="storage-children">

                    <button class="child-item" :class="{
                        active:
                            isActive(
                                '/storage/tests'
                            )
                    }" @click="goToTests" type="button">
                        <span class="child-icon">
                            📝
                        </span>

                        Tests
                    </button>


                    <button class="child-item" :class="{
                        active:
                            isActive(
                                '/storage/categories'
                            )
                    }" @click="goToCategories" type="button">
                        <span class="child-icon">
                            📂
                        </span>

                        Categories
                    </button>


                    <button class="child-item" :class="{
                        active:
                            isActive(
                                '/storage/words'
                            )
                    }" @click="goToWords" type="button">
                        <span class="child-icon">
                            🔤
                        </span>

                        Words
                    </button>

                </div>

            </div>

        </nav>
    </div>
</template>

<style scoped>
.sidebar {
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
    color: white;
    display: flex;
    flex-direction: column;
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
}

.sidebar-header h3 {
    margin: 0;
    white-space: nowrap;
}

.toggle-btn {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
}

.nav-item {
    width: 100%;
    display: flex;
    align-items: center;
    padding: 15px 20px;
    color: #bbb;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    text-align: left;
    box-sizing: border-box;
}

.nav-item:hover {
    background-color: #333;
    color: white;
}

.nav-item.active {
    background-color: #2f2f2f;
    color: white;
}

.icon {
    width: 24px;
    min-width: 24px;
    text-align: center;
}

.text {
    margin-left: 15px;
    white-space: nowrap;
}

.storage-section {
    width: 100%;
}

.storage-row {
    display: flex;
    align-items: stretch;
}

.storage-main {
    flex: 1;
}

.storage-toggle {
    width: 42px;
    background: none;
    border: none;
    color: #bbb;
    cursor: pointer;
    font-size: 18px;
}

.storage-toggle:hover {
    background-color: #333;
    color: white;
}

.storage-children {
    display: flex;
    flex-direction: column;
    background-color: #111;
}

.child-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 20px 11px 52px;
    border: none;
    background: none;
    color: #999;
    cursor: pointer;
    font: inherit;
    text-align: left;
}

.child-item:hover {
    background-color: #292929;
    color: white;
}

.child-item.active {
    background-color: #292929;
    color: white;
}

.child-icon {
    width: 18px;
}
</style>
