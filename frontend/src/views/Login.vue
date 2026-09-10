<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');

async function handleLogin() {
    try {
        await authStore.login({
            username: username.value,
            password: password.value,
        });

        const returnTo =
            sessionStorage.getItem(
                'login_return_to'
            );

        if (returnTo) {
            sessionStorage.removeItem(
                'login_return_to'
            );

            router.push(returnTo);
            return;
        }

        router.push('/');
    } catch {
        // Error is already stored in authStore
    }
}

</script>

<template>
    <div class="auth-page">
        <div class="auth-card">
            <h1>Log in</h1>

            <form @submit.prevent="handleLogin">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input id="username" v-model="username" type="text" autocomplete="username" required />
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input id="password" v-model="password" type="password" autocomplete="current-password" required />
                </div>

                <p v-if="authStore.error" class="error">
                    {{ authStore.error }}
                </p>

                <button type="submit" :disabled="authStore.isLoading">
                    {{ authStore.isLoading ? 'Logging in...' : 'Log in' }}
                </button>
            </form>

            <p class="switch-auth">
                Don't have an account?
                <RouterLink to="/register">
                    Register
                </RouterLink>
            </p>
        </div>
    </div>
</template>

<style scoped>
.auth-page {
    min-height: 85vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: rem;
}

.auth-card {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

h1 {
    margin-bottom: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

label {
    display: block;
    margin-bottom: 0.4rem;
}

input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 6px;
}

button {
    width: 100%;
    padding: 0.75rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    background: #3b82f6;
    color: white;
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.error {
    color: #dc2626;
    margin-bottom: 1rem;
}

.switch-auth {
    margin-top: 1.5rem;
    text-align: center;
}
</style>