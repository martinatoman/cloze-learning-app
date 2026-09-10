import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../services/api";
import { useGroupStore } from "./groupStore";
import type { User } from "../../../shared/types";

export const useAuthStore = defineStore("auth", () => {
    const user = ref<User | null>(null);

    const token = ref<string | null>(
        localStorage.getItem("token") || null
    );

    const isLoading = ref(false);

    const error = ref<string | null>(null);

    const isGuest = computed(
        () => !token.value || !user.value
    );

    const userLevel = computed(() => {
        if (!user.value) {
            return 1;
        }

        return (
            Math.floor(
                user.value.total_xp / 100
            ) + 1
        );
    });

    /*
     * ============================================================
     * MIGRATE GUEST GROUPS AFTER LOGIN
     * ============================================================
     */

    async function migrateGuestGroupsAfterLogin() {
        const savedGuestColors =
            localStorage.getItem(
                "guest_categories"
            );

        if (!savedGuestColors) {
            console.log(
                "[AUTH] No guest categories found."
            );

            return {};
        }

        let guestColors: {
            id: string;
            name: string;
            hex: string;
        }[];

        try {
            guestColors =
                JSON.parse(
                    savedGuestColors
                );
        } catch (parseError) {
            console.error(
                "[AUTH] Failed to parse guest categories:",
                parseError
            );

            return {};
        }

        if (!Array.isArray(guestColors)) {
            console.log(
                "[AUTH] Guest categories is not an array."
            );

            return {};
        }

        console.log(
            "[AUTH] Guest colors before migration:",
            guestColors
        );

        const groupStore =
            useGroupStore();

        /*
         * Determine which guest colors are actually
         * being used by the current editor.
         *
         * The editor stores its blanks in the cloze store,
         * so we intentionally do NOT try to migrate every
         * guest color here.
         *
         * The groupStore will only migrate the IDs we give it.
         *
         * For now, migrate all guest colors. This keeps the
         * migration reliable and avoids losing a category
         * that may still be referenced by editor state.
         */

        const usedColorIds =
            guestColors.map(
                (color) => color.id
            );

        const colorMapping =
            await groupStore.migrateGuestGroups(
                guestColors,
                usedColorIds
            );

        console.log(
            "[AUTH] Guest group migration result:",
            colorMapping
        );

        /*
         * Save the mapping so Editor.vue can use it
         * to convert guest-* IDs into group-* IDs.
         */

        if (
            Object.keys(
                colorMapping
            ).length > 0
        ) {
            localStorage.setItem(
                "guest_color_migration",
                JSON.stringify(
                    colorMapping
                )
            );
        }

        /*
         * Remove successfully migrated colors
         * from guest_categories.
         */

        const migratedIds =
            Object.keys(
                colorMapping
            );

        if (
            migratedIds.length > 0
        ) {
            const remainingColors =
                guestColors.filter(
                    (color) =>
                        !migratedIds.includes(
                            color.id
                        )
                );

            localStorage.setItem(
                "guest_categories",
                JSON.stringify(
                    remainingColors
                )
            );
        }

        return colorMapping;
    }

    /*
     * ============================================================
     * REGISTER
     * ============================================================
     */

    async function register(data: {
        username: string;
        display_name: string;
        password: string;
    }) {
        isLoading.value = true;
        error.value = null;

        try {
            const response =
                await api.post(
                    "/auth/register",
                    data
                );

            return response.data.user;
        } catch (err: any) {
            error.value =
                err.response?.data?.message ||
                "Registration failed";

            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    /*
     * ============================================================
     * LOGIN
     * ============================================================
     */

    async function login(credentials: {
        username: string;
        password: string;
    }) {
        isLoading.value = true;
        error.value = null;

        try {
            const response =
                await api.post(
                    "/auth/login",
                    credentials
                );

            token.value =
                response.data.token;

            user.value =
                response.data.user;

            localStorage.setItem(
                "token",
                response.data.token
            );

            try {
                const migration =
                    await migrateGuestGroupsAfterLogin();

                console.log(
                    "[AUTH] Final migration mapping:",
                    migration
                );
            } catch (migrationError) {
                console.error(
                    "[AUTH] Guest group migration failed:",
                    migrationError
                );
            }

            return response.data.user;
        } catch (err: any) {
            error.value =
                err.response?.data?.message ||
                "Login failed";

            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    /*
     * ============================================================
     * CURRENT USER
     * ============================================================
     */

    async function fetchCurrentUser() {
        if (!token.value) {
            return;
        }

        try {
            const response =
                await api.get(
                    "/users/me"
                );

            user.value =
                response.data.user;
        } catch {
            logout();
        }
    }

    /*
     * ============================================================
     * LOGOUT
     * ============================================================
     */

    function logout() {
        token.value = null;
        user.value = null;

        localStorage.removeItem(
            "token"
        );
    }

    return {
        user,
        token,
        isLoading,
        error,
        isGuest,
        userLevel,
        register,
        login,
        fetchCurrentUser,
        migrateGuestGroupsAfterLogin,
        logout,
    };
});
