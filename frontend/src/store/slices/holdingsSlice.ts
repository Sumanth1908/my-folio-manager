import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';
import { fetchAccounts } from './accountsSlice';

interface HoldingsState {
    loading: boolean;
    error: string | null;
}

const initialState: HoldingsState = {
    loading: false,
    error: null,
};

export const createHolding = createAsyncThunk(
    'holdings/createHolding',
    async (payload: any, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.post('/holdings/', payload);
            dispatch(fetchAccounts());
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create holding');
        }
    }
);

export const sellHolding = createAsyncThunk(
    'holdings/sellHolding',
    async ({ holdingId, quantity, price }: { holdingId: number, quantity: number, price: number }, { dispatch, rejectWithValue }) => {
        try {
            const res = await api.post(`/holdings/${holdingId}/sell`, { quantity, price });
            dispatch(fetchAccounts());
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to sell holding');
        }
    }
);

export const deleteHolding = createAsyncThunk(
    'holdings/deleteHolding',
    async (holdingId: number, { dispatch, rejectWithValue }) => {
        try {
            await api.delete(`/holdings/${holdingId}`);
            dispatch(fetchAccounts());
            return holdingId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete holding');
        }
    }
);

export const holdingsSlice = createSlice({
    name: 'holdings',
    initialState,
    reducers: {
        clearHoldingsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createHolding.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createHolding.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(createHolding.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(sellHolding.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sellHolding.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(sellHolding.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteHolding.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteHolding.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(deleteHolding.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearHoldingsError } = holdingsSlice.actions;
export default holdingsSlice.reducer;
