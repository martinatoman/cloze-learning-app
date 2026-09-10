import { AppError } from './appError';

export const checkOwnership = (
    resource: { user_id: number | null },
    requestor_id: number | null,
    resourceName: string = 'Resource',
    allowPublic: boolean = false
) => {
    // Public resources can be accessed by anyone.
    if (resource.user_id === null && allowPublic) {
        return;
    }

    // A resource with no owner is private unless explicitly marked public.
    if (resource.user_id === null) {
        throw new AppError(
            `${resourceName} access denied`,
            403
        );
    }

    // Private resource + guest request = denied.
    if (requestor_id === null) {
        throw new AppError(
            `${resourceName} access denied`,
            403
        );
    }

    // Private resource belongs to someone else.
    if (resource.user_id !== requestor_id) {
        throw new AppError(
            `${resourceName} access denied`,
            403
        );
    }


};