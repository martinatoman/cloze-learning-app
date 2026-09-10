import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import './style.css';

import { useAuthStore } from './stores/authStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const authStore = useAuthStore(pinia);

async function initializeApp() {
    if (authStore.token) {
        await authStore.fetchCurrentUser();
    }

    app.mount('#app');
}

initializeApp();
