import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import type { Account, PaginatedResponse } from '../../types';

interface AccountsState {
    items: Account[];
    total: number;
    loading: boolean;
    error: string | null;
}

const initialState: AccountsState = {
    items: [],
    total: 0,
    loading: false,
    error: null,
};

export const fetchAccounts = createAsyncThunk(
    'accounts/fetchAccounts',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/accounts/', { params: { limit: 100 } });
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch accounts');
        }
    }
);

export const createAccount = createAsyncThunk(
    'accounts/createAccount',
    async (payload: any, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.post('/accounts/', payload);
            dispatch(fetchAccounts());
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create account');
        }
    }
);

export const updateAccount = createAsyncThunk(
    'accounts/updateAccount',
    async ({ id, data }: { id: string, data: any }, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.patch(`/accounts/${id}`, data);
            dispatch(fetchAccounts());
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update account');
        }
    }
);

export const deleteAccount = createAsyncThunk(
    'accounts/deleteAccount',
    async (id: string, { dispatch, rejectWithValue }) => {
        try {
            await api.delete(`/accounts/${id}`);
            dispatch(fetchAccounts());
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete account');
        }
    }
);

export const accountsSlice = createSlice({
    name: 'accounts',
    initialState,
    reducers: {
        clearAccountsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAccounts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAccounts.fulfilled, (state, action: PayloadAction<PaginatedResponse<Account>>) => {
                state.loading = false;
                state.items = action.payload.items;
                state.total = action.payload.total;
            })
            .addCase(fetchAccounts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearAccountsError } = accountsSlice.actions;
export default accountsSlice.reducer;
