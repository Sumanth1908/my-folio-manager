import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | undefined | null, showTime: boolean = false) {
    if (!date) return '';
    
    let d: Date;
    if (typeof date === 'string') {
        // Ensure string is correctly formatted as UTC ISO
        const iso = date.replace(' ', 'T');
        const utcIso = iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z';
        d = new Date(utcIso);
    } else {
        d = date;
    }
    
    if (isNaN(d.getTime())) return '';
    
    if (showTime) {
        return d.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'UTC'
        }).replace(/, /g, ' ').replace(/\//g, '-');
    }

    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
    }).replace(/ /g, '-');
}

export function getCurrentMonthRange() {
    const now = new Date();
    const toISODate = (d: Date) => d.toISOString().slice(0, 10);
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: toISODate(start), end: toISODate(end) };
}

// "YYYY-MM" helpers for month-specific budgets
export function getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonths(yearMonth: string, delta: number): string {
    const [year, month] = yearMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
