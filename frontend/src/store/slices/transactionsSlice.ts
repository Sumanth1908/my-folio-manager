import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import type { Transaction, PaginatedResponse } from '../../types';

interface TransactionsState {
    items: Transaction[];
    total: number;
    loading: boolean;
    loadingMore: boolean;
    hasNextPage: boolean;
    error: string | null;
    filters: {
        accountId: string | null;
        search: string;
        categoryId: string;
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
    };
}

const initialState: TransactionsState = {
    items: [],
    total: 0,
    loading: false,
    loadingMore: false,
    hasNextPage: false,
    error: null,
    filters: {
        accountId: null,
        search: '',
        categoryId: 'all',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 20,
    },
};

export const fetchTransactions = createAsyncThunk(
    'transactions/fetchTransactions',
    async (params: { accountId?: string | null; search?: string; categoryId?: string; startDate?: string; endDate?: string; page?: number; limit?: number; append?: boolean } | undefined, { rejectWithValue }) => {
        try {
            const { accountId, search, categoryId, startDate, endDate, page = 1, limit = 20 } = params || {};
            const skip = (page - 1) * limit;
            const queryParams: any = { skip, limit };
            if (accountId) queryParams.account_id = accountId;
            if (search) queryParams.search = search;
            if (categoryId && categoryId !== 'all') queryParams.category_id = categoryId;
            if (startDate) queryParams.start_date = startDate;
            if (endDate) queryParams.end_date = endDate;

            const res = await api.get('/transactions/', { params: queryParams });
            return { ...res.data, append: params?.append };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
        }
    }
);

export const createTransaction = createAsyncThunk(
    'transactions/createTransaction',
    async (payload: any, { dispatch, getState, rejectWithValue }) => {
        try {
            const res = await api.post('/transactions/', payload);
            const { filters } = (getState() as any).transactions;
            dispatch(fetchTransactions({ ...filters, page: 1, append: false }));
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create transaction');
        }
    }
);

export const createTransfer = createAsyncThunk(
    'transactions/createTransfer',
    async (payload: any, { dispatch, getState, rejectWithValue }) => {
        try {
            const res = await api.post('/transactions/transfer/', payload);
            const { filters } = (getState() as any).transactions;
            dispatch(fetchTransactions({ ...filters, page: 1, append: false }));
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create transfer');
        }
    }
);

export const updateTransaction = createAsyncThunk(
    'transactions/updateTransaction',
    async ({ id, data }: { id: number, data: any }, { dispatch, getState, rejectWithValue }) => {
        try {
            const res = await api.patch(`/transactions/${id}`, data);
            const { filters } = (getState() as any).transactions;
            dispatch(fetchTransactions({ ...filters, page: 1, append: false }));
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update transaction');
        }
    }
);

export const deleteTransaction = createAsyncThunk(
    'transactions/deleteTransaction',
    async (id: number, { dispatch, getState, rejectWithValue }) => {
        try {
            await api.delete(`/transactions/${id}`);
            const { filters } = (getState() as any).transactions;
            dispatch(fetchTransactions({ ...filters, page: 1, append: false }));
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete transaction');
        }
    }
);

export const transactionsSlice = createSlice({
    name: 'transactions',
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<Partial<TransactionsState['filters']>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        clearTransactions: (state) => {
            state.items = [];
            state.total = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchTransactions.pending, (state, action) => {
                if (action.meta.arg?.append) {
                    state.loadingMore = true;
                } else {
                    state.loading = true;
                }
                state.error = null;
            })
            .addCase(fetchTransactions.fulfilled, (state, action: PayloadAction<PaginatedResponse<Transaction> & { append?: boolean }>) => {
                state.loading = false;
                state.loadingMore = false;
                if (action.payload.append) {
                    state.items = [...state.items, ...action.payload.items];
                } else {
                    state.items = action.payload.items;
                }
                state.total = action.payload.total;
                state.hasNextPage = state.items.length < state.total;
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.loadingMore = false;
                state.error = action.payload as string;
            });
    },
});

export const { setFilters, clearTransactions } = transactionsSlice.actions;
export default transactionsSlice.reducer;
