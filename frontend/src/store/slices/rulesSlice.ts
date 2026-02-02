import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import type { Rule } from '../../types';

interface RulesState {
    items: Rule[];
    loading: boolean;
    error: string | null;
}

const initialState: RulesState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchRules = createAsyncThunk(
    'rules/fetchRules',
    async (accountId: string | null | undefined, { rejectWithValue }) => {
        try {
            const url = accountId ? `/rules/?account_id=${accountId}` : '/rules/';
            const res = await api.get(url);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch rules');
        }
    }
);

export const createRule = createAsyncThunk(
    'rules/createRule',
    async (payload: any, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.post('/rules/', payload);
            dispatch(fetchRules(payload.account_id));
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create rule');
        }
    }
);

export const updateRule = createAsyncThunk(
    'rules/updateRule',
    async ({ id, data, accountId }: { id: number, data: any, accountId?: string | null }, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.put(`/rules/${id}`, data);
            dispatch(fetchRules(accountId));
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update rule');
        }
    }
);

export const deleteRule = createAsyncThunk(
    'rules/deleteRule',
    async ({ id, accountId }: { id: number, accountId?: string | null }, { dispatch, rejectWithValue }) => {
        try {
            await api.delete(`/rules/${id}`);
            dispatch(fetchRules(accountId));
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete rule');
        }
    }
);

export const executeRule = createAsyncThunk(
    'rules/executeRule',
    async ({ id, accountId }: { id: number, accountId?: string | null }, { dispatch, rejectWithValue }) => {
        try {
            await api.post(`/rules/${id}/execute`);
            dispatch(fetchRules(accountId));
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to execute rule');
        }
    }
);

export const rulesSlice = createSlice({
    name: 'rules',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRules.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRules.fulfilled, (state, action: PayloadAction<Rule[]>) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchRules.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default rulesSlice.reducer;
