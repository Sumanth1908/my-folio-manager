import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api';
import type { Account, AccountTypeDefinition, PaginatedResponse } from '../../types';

interface AccountsState {
    items: Account[];
    total: number;
    loading: boolean;
    error: string | null;
    accountTypes: AccountTypeDefinition[];
    typesLoading: boolean;
}

const initialState: AccountsState = {
    items: [],
    total: 0,
    loading: false,
    error: null,
    accountTypes: [],
    typesLoading: false,
};

export const fetchAccountTypes = createAsyncThunk(
    'accounts/fetchAccountTypes',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/accounts/types');
            return res.data as AccountTypeDefinition[];
        } catch (error: unknown) {
            return rejectWithValue(handleApiError(error, 'Failed to fetch account types'));
        }
    }
);

export const fetchAccounts = createAsyncThunk(
    'accounts/fetchAccounts',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/accounts/', { params: { limit: 100 } });
            return res.data;
        } catch (error: unknown) {
            return rejectWithValue(handleApiError(error, 'Failed to fetch accounts'));
        }
    }
);

export const createAccount = createAsyncThunk(
    'accounts/createAccount',
    async (payload: Record<string, unknown>, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.post('/accounts/', payload);
            dispatch(fetchAccounts());
            return res.data;
        } catch (error: unknown) {
            return rejectWithValue(handleApiError(error, 'Failed to create account'));
        }
    }
);

export const updateAccount = createAsyncThunk(
    'accounts/updateAccount',
    async ({ id, data }: { id: string, data: Record<string, unknown> }, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.patch(`/accounts/${id}`, data);
            dispatch(fetchAccounts());
            return res.data;
        } catch (error: unknown) {
            return rejectWithValue(handleApiError(error, 'Failed to update account'));
        }
    }
);

export const closeAccount = createAsyncThunk(
    'accounts/closeAccount',
    async ({ id, sourceAccountId }: { id: string, sourceAccountId?: string }, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.post(`/accounts/${id}/close`, sourceAccountId ? { source_account_id: sourceAccountId } : {});
            dispatch(fetchAccounts());
            return res.data;
        } catch (error: unknown) {
            return rejectWithValue(handleApiError(error, 'Failed to close account'));
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
        } catch (error: unknown) {
            return rejectWithValue(handleApiError(error, 'Failed to delete account'));
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
            })
            .addCase(fetchAccountTypes.pending, (state) => {
                state.typesLoading = true;
            })
            .addCase(fetchAccountTypes.fulfilled, (state, action: PayloadAction<AccountTypeDefinition[]>) => {
                state.typesLoading = false;
                state.accountTypes = action.payload;
            })
            .addCase(fetchAccountTypes.rejected, (state) => {
                state.typesLoading = false;
            });
    },
});

export const { clearAccountsError } = accountsSlice.actions;
export default accountsSlice.reducer;
