<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import { useAuthStore } from './stores/authStore.ts'

const isCollapsed = ref(false)

const auth = useAuthStore()
const router = useRouter()

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

onMounted(async () => {
  await auth.fetchCurrentUser()
})

const goToLogin = () => {
  router.push('/login')
}

const handleLogout = () => {
  auth.logout()
}
</script>

<template>
  <div class="app-container" :class="{ 'sidebar-is-collapsed': isCollapsed }">
    <Sidebar :isCollapsed="isCollapsed" @toggle="toggleSidebar" />

    <main class="main-content">
      <!-- Login / Logout area -->
      <div class="auth-bar">
        <!-- Logged in -->
        <div v-if="auth.user" class="logged-in">
          <span class="user-name">
            👤 {{ auth.user.display_name || auth.user.username }}
          </span>

          <span class="user-level">
            Level {{ auth.userLevel }}
          </span>

          <button type="button" class="logout-button" @click="handleLogout">
            Logout
          </button>
        </div>

        <!-- Logged out -->
        <div v-else class="logged-out">
          <span class="guest-text">
            Not logged in
          </span>

          <button type="button" class="login-button" @click="goToLogin">
            Login
          </button>
        </div>
      </div>

      <!-- Page content -->
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: sans-serif;
}

.app-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  height: 100vh;
  width: 100vw;
  transition: grid-template-columns 0.3s ease;
  overflow: hidden;
}

.app-container.sidebar-is-collapsed {
  grid-template-columns: 60px 1fr;
}

.main-content {
  background-color: #f5f5f5;
  padding: 20px;
  overflow-y: auto;
}

.auth-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.logged-in,
.logged-out {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  color: #333;
  font-weight: 600;
}

.user-level {
  padding: 5px 10px;
  border-radius: 20px;
  background-color: #4f46e5;
  color: white;
  font-size: 13px;
  font-weight: 600;
}

.guest-text {
  color: #777;
}

.login-button,
.logout-button {
  padding: 9px 18px;
  border: none;
  border-radius: 7px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.login-button {
  background-color: #4f46e5;
}

.login-button:hover {
  background-color: #4338ca;
}

.logout-button {
  background-color: #dc2626;
}

.logout-button:hover {
  background-color: #b91c1c;
}

.content-wrapper {
  max-width: 100%;
  word-wrap: break-word;
}
</style>
