import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api';
import type { SummaryResponse, UpcomingItem } from '../../types';

import { TIME_RANGES } from '../../constants';

export type SummaryTimeRange = typeof TIME_RANGES[number];

interface SummaryState {
    data: SummaryResponse | null;
    loading: boolean;
    error: string | null;
    upcoming: UpcomingItem[];
    upcomingLoading: boolean;
    filters: {
        timeRange: SummaryTimeRange;
        accountTypes: string[];
    };
}

const initialState: SummaryState = {
    data: null,
    loading: false,
    error: null,
    upcoming: [],
    upcomingLoading: false,
    filters: {
        timeRange: 'currentMonth',
        accountTypes: [],
    },
};

export const fetchUpcoming = createAsyncThunk(
    'summary/fetchUpcoming',
    async (days: number = 30, { rejectWithValue }) => {
        try {
            const res = await api.get('/summary/upcoming', { params: { days } });
            return res.data.items as UpcomingItem[];
        } catch (error: any) {
            return rejectWithValue(handleApiError(error, 'Failed to fetch upcoming payments'));
        }
    }
);

export const fetchSummary = createAsyncThunk(
    'summary/fetchSummary',
    async (params: { timeRange: SummaryTimeRange; accountTypes?: string[] }, { rejectWithValue }) => {
        try {
            const { timeRange, accountTypes } = params;
            const apiParams: any = {};

            if (accountTypes && accountTypes.length > 0) {
                apiParams.account_types = accountTypes;
            }

            if (timeRange === 'last30Days') {
                const now = new Date();
                const thirtyDaysAgo = new Date(now);
                thirtyDaysAgo.setDate(now.getDate() - 29); // 30 days including today
                thirtyDaysAgo.setHours(0, 0, 0, 0);

                const endOfToday = new Date(now);
                endOfToday.setHours(23, 59, 59, 999);

                apiParams.from_date = thirtyDaysAgo.toISOString();
                apiParams.to_date = endOfToday.toISOString();
            } else if (timeRange === 'currentMonth') {
                const now = new Date();
                const endOfToday = new Date(now);
                endOfToday.setHours(23, 59, 59, 999);

                apiParams.from_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                apiParams.to_date = endOfToday.toISOString();
            } else if (timeRange === 'lastMonth') {
                const now = new Date();
                apiParams.from_date = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
                apiParams.to_date = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
            }

            const res = await api.get('/summary/accounts', {
                params: apiParams,
                paramsSerializer: {
                    indexes: null
                }
            });
            return res.data;
        } catch (error: any) {
            return rejectWithValue(handleApiError(error, 'Failed to fetch summary'));
        }
    }
);

export const summarySlice = createSlice({
    name: 'summary',
    initialState,
    reducers: {
        setSummaryTimeRange: (state, action: PayloadAction<SummaryTimeRange>) => {
            state.filters.timeRange = action.payload;
        },
        setSummaryAccountTypes: (state, action: PayloadAction<string[]>) => {
            state.filters.accountTypes = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSummary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSummary.fulfilled, (state, action: PayloadAction<SummaryResponse>) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchUpcoming.pending, (state) => {
                state.upcomingLoading = true;
            })
            .addCase(fetchUpcoming.fulfilled, (state, action) => {
                state.upcomingLoading = false;
                state.upcoming = action.payload;
            })
            .addCase(fetchUpcoming.rejected, (state) => {
                state.upcomingLoading = false;
            });
    },
});

export const { setSummaryTimeRange, setSummaryAccountTypes } = summarySlice.actions;
export default summarySlice.reducer;
