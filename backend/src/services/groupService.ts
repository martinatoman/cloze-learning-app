import { groupRepository } from '../repositories/groupRepository';
import { AppError } from '../utils/appError';
import { checkOwnership } from '../utils/security';
import { Group } from '../../../shared/types';

export const groupService = {
    async getGroupById(
        group_id: number,
        user_id: number
    ): Promise<Group> {
        const group = await groupRepository.getGroupById(
            group_id
        );

        if (!group) {
            throw new AppError(
                'Group not found',
                404
            );
        }

        checkOwnership(
            group,
            user_id,
            'Group'
        );

        return group;
    },

    async getGroupsByUserId(
        user_id: number
    ): Promise<Group[]> {
        return groupRepository.getGroupsByUserId(
            user_id
        );
    },

    async createGroup(
        user_id: number,
        name: string,
        color_hex?: string
    ): Promise<{ group_id: number }> {
        if (!name?.trim()) {
            throw new AppError(
                'Group name is required',
                400
            );
        }

        const group_id = await groupRepository.createGroup(
            user_id,
            {
                name: name.trim(),
                color_hex: color_hex || '#c3cedb',
            }
        );

        return { group_id };
    },

    async updateGroup(
        group_id: number,
        user_id: number,
        updates: {
            name?: string;
            color_hex?: string;
        }
    ): Promise<{ message: string }> {
        await groupService.getGroupById(
            group_id,
            user_id
        );

        if (
            updates.name !== undefined &&
            !updates.name.trim()
        ) {
            throw new AppError(
                'Group name cannot be empty',
                400
            );
        }

        await groupRepository.updateGroup(
            group_id,
            updates
        );

        return {
            message: 'Group updated successfully'
        };
    },

    async deleteGroup(
        group_id: number,
        user_id: number
    ): Promise<{ message: string }> {
        await groupService.getGroupById(
            group_id,
            user_id
        );

        await groupRepository.deleteGroup(
            group_id
        );

        return {
            message: 'Group deleted successfully'
        };
    },


};