import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import type { Currency } from '../../types';

interface CurrenciesState {
    items: Currency[];
    loading: boolean;
    error: string | null;
}

const initialState: CurrenciesState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchCurrencies = createAsyncThunk(
    'currencies/fetchCurrencies',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/currencies/');
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch currencies');
        }
    }
);

export const currenciesSlice = createSlice({
    name: 'currencies',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrencies.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCurrencies.fulfilled, (state, action: PayloadAction<Currency[]>) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCurrencies.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default currenciesSlice.reducer;
