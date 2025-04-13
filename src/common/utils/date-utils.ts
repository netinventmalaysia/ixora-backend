import { format, differenceInDays, parseISO } from 'date-fns';

export function formatDate(date: Date | string, pattern = 'yyyy-MM-dd HH:mm:ss') {
    return format(typeof date === 'string' ? parseISO(date) : date, pattern);
}

export function daysBetween(from: string | Date, to: string | Date) {
    return differenceInDays(
        typeof to === 'string' ? parseISO(to) : to,
        typeof from === 'string' ? parseISO(from) : from,
    );
}
