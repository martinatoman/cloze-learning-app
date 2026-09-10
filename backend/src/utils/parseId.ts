import { AppError } from './appError';

export function parseId(value: string | string[], name = 'ID'): number {
    if (Array.isArray(value)) {
        throw new AppError(`Invalid ${name}`, 400);
    }

    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(`Invalid ${name}`, 400);
    }

    return id;
}
