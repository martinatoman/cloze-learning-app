import { createRouter, createWebHistory } from 'vue-router';

import Home from '../views/Home.vue';
import Editor from '../views/Editor.vue';
import Test from '../views/Test.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';

import Storage from '../views/Storage.vue';
import StorageTests from '../views/StorageTests.vue';
import StorageCategories from '../views/StorageCategories.vue';
import StorageCategory from '../views/StorageCategory.vue';
import StorageWords from '../views/StorageWords.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guestOnly: true },
  },

  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { guestOnly: true },
  },

  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false },
  },

  {
    path: '/editor',
    name: 'Editor',
    component: Editor,
    meta: { requiresAuth: false },
  },

  {
    path: '/test',
    name: 'Test',
    component: Test,
    meta: { requiresAuth: false },
  },

  {
    path: '/storage',
    name: 'Storage',
    component: Storage,
    meta: { requiresAuth: true },
  },

  {
    path: '/storage/tests',
    name: 'StorageTests',
    component: StorageTests,
    meta: { requiresAuth: true },
  },

  {
    path: '/storage/categories',
    name: 'StorageCategories',
    component: StorageCategories,
    meta: { requiresAuth: true },
  },

  {
    path: '/storage/categories/:group_id',
    name: 'StorageCategory',
    component: StorageCategory,
    meta: { requiresAuth: true },
  },

  {
    path: '/storage/words',
    name: 'StorageWords',
    component: StorageWords,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth && !token) {
    return '/login';
  }

  if (to.meta.guestOnly && token) {
    return '/';
  }
});

export default router;
