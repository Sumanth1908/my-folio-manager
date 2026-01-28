import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const res = await api.patch(`/accounts/${id}`, data);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
            queryClient.invalidateQueries({ queryKey: ['account', data.account_id] });
        }
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/accounts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
        }
    });
}
