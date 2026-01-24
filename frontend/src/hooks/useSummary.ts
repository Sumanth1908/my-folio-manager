import { useQuery } from '@tanstack/react-query';
import api from '../api';
import type { SummaryResponse } from '../types';

export type SummaryTimeRange = 'thisMonth' | 'lastMonth' | 'allTime';

interface UseSummaryProps {
    timeRange: SummaryTimeRange;
    accountTypes?: string[];
}

export function useSummary({ timeRange, accountTypes }: UseSummaryProps) {
    return useQuery<SummaryResponse>({
        queryKey: ['accountSummary', timeRange, accountTypes],
        queryFn: async () => {
            const params: any = {};

            // Handle account types
            if (accountTypes && accountTypes.length > 0) {
                params.account_types = accountTypes;
            }

            // Handle date ranges
            if (timeRange === 'thisMonth') {
                const now = new Date();
                params.from_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                params.to_date = now.toISOString();
            } else if (timeRange === 'lastMonth') {
                const now = new Date();
                params.from_date = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                params.to_date = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
            }

            const res = await api.get('/summary/accounts', {
                params,
                // Ensure array params are serialized correctly for FastAPI (multiple account_types keys)
                paramsSerializer: {
                    indexes: null
                }
            });
            return res.data;
        }
    });
}
