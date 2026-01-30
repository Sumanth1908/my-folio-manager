import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ExchangeRateResponse {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
}

interface ConverterState {
    base: string | null;
    rates: Record<string, number>;
    lastUpdated: number | null;
    loading: boolean;
    error: string | null;
}

const initialState: ConverterState = {
    base: null,
    rates: {},
    lastUpdated: null,
    loading: false,
    error: null,
};

export const fetchRates = createAsyncThunk(
    'converter/fetchRates',
    async (base: string, { rejectWithValue }) => {
        try {
            const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`);
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            return await response.json() as ExchangeRateResponse;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch rates');
        }
    },
    {
        condition: (base, { getState }) => {
            const { converter } = getState() as { converter: ConverterState };
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            // Determine if we should skip the fetch
            // Skip if: same base currency AND data is fresh (< 24h)
            if (
                converter.base === base &&
                converter.lastUpdated &&
                (now - converter.lastUpdated) < oneDay
            ) {
                return false;
            }
            return true;
        }
    }
);

export const converterSlice = createSlice({
    name: 'converter',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRates.fulfilled, (state, action: PayloadAction<ExchangeRateResponse>) => {
                state.loading = false;
                state.base = action.payload.base;
                state.rates = action.payload.rates;
                state.lastUpdated = Date.now();
            })
            .addCase(fetchRates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default converterSlice.reducer;
