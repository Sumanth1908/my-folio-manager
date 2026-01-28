import { useQuery } from '@tanstack/react-query';
import api from '../api';
import type { Currency } from '../types';

export function useCurrencies() {
    return useQuery<Currency[]>({
        queryKey: ['currencies'],
        queryFn: async () => {
            const res = await api.get('/currencies/');
            return res.data;
        },
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        refetchOnWindowFocus: false,
    });
}
