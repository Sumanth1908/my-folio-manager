import { useQuery } from '@tanstack/react-query';
import api from '../api';
import type { Account, PaginatedResponse } from '../types';

export function useAccounts() {
    return useQuery<PaginatedResponse<Account>>({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/accounts/', { params: { limit: 100 } });
            return res.data;
        }
    });
}
