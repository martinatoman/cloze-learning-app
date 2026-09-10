<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const displayName = ref('');
const password = ref('');
const confirmPassword = ref('');
const localError = ref('');

async function handleRegister() {
    localError.value = '';

    if (password.value !== confirmPassword.value) {
        localError.value = 'Passwords do not match';
        return;
    }

    try {
        await authStore.register({
            username: username.value,
            display_name: displayName.value,
            password: password.value,
        });

        router.push('/login');
    } catch {
        // Error is already stored in authStore
    }
}
</script>

<template>
    <div class="auth-page">
        <div class="auth-card">
            <h1>Create account</h1>

            <form @submit.prevent="handleRegister">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input id="username" v-model="username" type="text" autocomplete="username" required />
                </div>

                <div class="form-group">
                    <label for="displayName">Display name</label>
                    <input id="displayName" v-model="displayName" type="text" autocomplete="name" required />
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input id="password" v-model="password" type="password" autocomplete="new-password" required />
                </div>

                <div class="form-group">
                    <label for="confirmPassword">
                        Confirm password
                    </label>
                    <input id="confirmPassword" v-model="confirmPassword" type="password" autocomplete="new-password"
                        required />
                </div>

                <p v-if="localError" class="error">
                    {{ localError }}
                </p>

                <p v-else-if="authStore.error" class="error">
                    {{ authStore.error }}
                </p>

                <button type="submit" :disabled="authStore.isLoading">
                    {{
                        authStore.isLoading
                            ? 'Creating account...'
                            : 'Create account'
                    }}
                </button>
            </form>

            <p class="switch-auth">
                Already have an account?
                <RouterLink to="/login">
                    Log in
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
    padding: 2rem;
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