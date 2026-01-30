import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import type { SummaryResponse } from '../../types';

import { TIME_RANGES } from '../../constants';

export type SummaryTimeRange = typeof TIME_RANGES[number];

interface SummaryState {
    data: SummaryResponse | null;
    loading: boolean;
    error: string | null;
    filters: {
        timeRange: SummaryTimeRange;
        accountTypes: string[];
    };
}

const initialState: SummaryState = {
    data: null,
    loading: false,
    error: null,
    filters: {
        timeRange: 'thisMonth',
        accountTypes: [],
    },
};

export const fetchSummary = createAsyncThunk(
    'summary/fetchSummary',
    async (params: { timeRange: SummaryTimeRange; accountTypes?: string[] }, { rejectWithValue }) => {
        try {
            const { timeRange, accountTypes } = params;
            const apiParams: any = {};

            if (accountTypes && accountTypes.length > 0) {
                apiParams.account_types = accountTypes;
            }

            if (timeRange === 'thisMonth') {
                const now = new Date();
                apiParams.from_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                apiParams.to_date = now.toISOString();
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
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch summary');
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
            });
    },
});

export const { setSummaryTimeRange, setSummaryAccountTypes } = summarySlice.actions;
export default summarySlice.reducer;
