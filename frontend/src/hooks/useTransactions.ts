import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../api';
import type { Transaction, PaginatedResponse } from '../types';

interface TransactionFilters {
    accountId?: string | null;
    search?: string;
    categoryId?: string | null;
}

export function useTransactions(filters: TransactionFilters = {}) {
    const { accountId, search, categoryId } = filters;
    const queryKey = ['transactions', { accountId, search, categoryId }];
    const ITEMS_PER_PAGE = 10;

    return useInfiniteQuery<PaginatedResponse<Transaction>>({
        queryKey: queryKey,
        queryFn: async ({ pageParam = 0 }) => {
            const params: any = {
                skip: pageParam,
                limit: ITEMS_PER_PAGE
            };

            if (accountId) params.account_id = accountId;
            if (search) params.search = search;
            if (categoryId && categoryId !== 'all') params.category_id = categoryId;

            const res = await api.get('/transactions/', { params });
            return {
                ...res.data,
                items: res.data.items.map((tx: any) => ({
                    ...tx,
                    amount: Number(tx.amount)
                }))
            };
        },
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.length * ITEMS_PER_PAGE;
            if (loadedCount < lastPage.total) {
                return loadedCount;
            }
            return undefined;
        },
        initialPageParam: 0,
        enabled: true
    });
}
