import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api } from "../services/api";
import type { Group } from "../../../shared/types";

export const useGroupStore = defineStore("groups", () => {
    const groups = ref<Group[]>([]);
    const isLoading = ref(false);

    const activeGroups = computed(() =>
        groups.value.filter(
            (group) => !group.is_deleted
        )
    );

    async function fetchMyGroups() {
        isLoading.value = true;

        try {
            const response = await api.get("/groups/my");

            groups.value = response.data;
        } finally {
            isLoading.value = false;
        }
    }

    async function createGroup(
        name: string,
        color_hex?: string
    ): Promise<Group> {
        const response = await api.post("/groups", {
            name,
            color_hex,
        });

        await fetchMyGroups();

        const createdGroup = groups.value.find(
            (group) =>
                group.group_id ===
                response.data.group_id
        );

        if (!createdGroup) {
            throw new Error(
                "Group was created but could not be loaded."
            );
        }

        return createdGroup;
    }

    async function migrateGuestGroups(
        guestColors: {
            id: string;
            name: string;
            hex: string;
        }[],
        usedColorIds: string[]
    ): Promise<Record<string, string>> {
        const colorMapping: Record<string, string> = {};

        const usedIds = new Set(
            usedColorIds
        );

        const colorsToMigrate =
            guestColors.filter(
                (color) =>
                    usedIds.has(color.id) &&
                    color.name.trim()
            );

        for (
            const color of colorsToMigrate
        ) {
            try {
                const createdGroup =
                    await createGroup(
                        color.name.trim(),
                        color.hex
                    );

                colorMapping[color.id] =
                    `group-${createdGroup.group_id}`;
            } catch (error) {
                console.error(
                    `Failed to migrate guest group "${color.name}":`,
                    error
                );
            }
        }

        return colorMapping;
    }

    async function updateGroup(
        group_id: number,
        updates: {
            name?: string;
            color_hex?: string;
        }
    ) {
        await api.put(
            `/groups/${group_id}`,
            updates
        );

        await fetchMyGroups();
    }

    async function deleteGroup(
        group_id: number
    ) {
        await api.delete(
            `/groups/${group_id}`
        );

        groups.value =
            groups.value.filter(
                (group) =>
                    group.group_id !== group_id
            );
    }

    function getGroupById(
        group_id: number
    ): Group | undefined {
        return groups.value.find(
            (group) =>
                group.group_id === group_id
        );
    }

    return {
        groups,
        activeGroups,
        isLoading,
        fetchMyGroups,
        createGroup,
        migrateGuestGroups,
        updateGroup,
        deleteGroup,
        getGroupById,
    };
});
