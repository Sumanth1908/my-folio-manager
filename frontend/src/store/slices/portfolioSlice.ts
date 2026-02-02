import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

interface HoldingSummary {
    symbol: string;
    name: string;
    quantity: number;
    current_price: number;
    current_value: number;
    cost_basis: number;
    profit_loss: number;
    profit_loss_percent: number;
    currency: string;
}

interface AccountPortfolioSummary {
    account_id: string;
    account_name: string;
    currency: string;
    total_value: number;
    total_cost: number;
    total_profit_loss: number;
    total_profit_loss_percent: number;
    holdings: HoldingSummary[];
}

interface PortfolioSummary {
    accounts: AccountPortfolioSummary[];
    total_value_default_currency: number;
    total_cost_default_currency: number;
    total_profit_loss_default_currency: number;
    total_profit_loss_percent: number;
    default_currency: string;
}

interface PortfolioState {
    summary: PortfolioSummary | null;
    loading: boolean;
    error: string | null;
}

const initialState: PortfolioState = {
    summary: null,
    loading: false,
    error: null,
};

export const fetchPortfolioSummary = createAsyncThunk(
    'portfolio/fetchSummary',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/portfolio/summary');
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch portfolio summary');
        }
    }
);

export const portfolioSlice = createSlice({
    name: 'portfolio',
    initialState,
    reducers: {
        clearPortfolioError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPortfolioSummary.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPortfolioSummary.fulfilled, (state, action) => {
                state.loading = false;
                state.summary = action.payload;
            })
            .addCase(fetchPortfolioSummary.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearPortfolioError } = portfolioSlice.actions;
export default portfolioSlice.reducer;
