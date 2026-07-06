import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api, { handleApiError } from '../../api';
import { getCurrentYearMonth } from '../../lib/utils';
import type { BudgetItem, YearlyBudgetCategory } from '../../types';

interface BudgetsState {
    items: BudgetItem[];
    loading: boolean;
    error: string | null;
    yearly: YearlyBudgetCategory[];
    yearlyLoading: boolean;
    selectedMonth: string;
}

const initialState: BudgetsState = {
    items: [],
    loading: false,
    error: null,
    yearly: [],
    yearlyLoading: false,
    selectedMonth: getCurrentYearMonth(),
};

export const fetchBudgets = createAsyncThunk(
    'budgets/fetchBudgets',
    async (month: string | undefined, { rejectWithValue }) => {
        try {
            const res = await api.get('/budgets/', { params: month ? { month } : undefined });
            return res.data as BudgetItem[];
        } catch (error) {
            return rejectWithValue(handleApiError(error, 'Failed to fetch budgets'));
        }
    }
);

export const fetchYearlyBudgets = createAsyncThunk(
    'budgets/fetchYearlyBudgets',
    async (year: number, { rejectWithValue }) => {
        try {
            const res = await api.get('/budgets/yearly', { params: { year } });
            return res.data as YearlyBudgetCategory[];
        } catch (error) {
            return rejectWithValue(handleApiError(error, 'Failed to fetch yearly budgets'));
        }
    }
);

export const upsertBudget = createAsyncThunk(
    'budgets/upsertBudget',
    async (
        { categoryId, amount, periodMonth, applyToFutureMonths }:
            { categoryId: number; amount: number; periodMonth: string; applyToFutureMonths?: number },
        { dispatch, getState, rejectWithValue }
    ) => {
        try {
            const res = await api.put('/budgets/', {
                category_id: categoryId,
                amount,
                period_month: periodMonth,
                apply_to_future_months: applyToFutureMonths || 0,
            });
            const state = getState() as { budgets: BudgetsState };
            dispatch(fetchBudgets(state.budgets.selectedMonth));
            return res.data;
        } catch (error) {
            return rejectWithValue(handleApiError(error, 'Failed to save budget'));
        }
    }
);

export const deleteBudget = createAsyncThunk(
    'budgets/deleteBudget',
    async (budgetId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/budgets/${budgetId}`);
            return budgetId;
        } catch (error) {
            return rejectWithValue(handleApiError(error, 'Failed to delete budget'));
        }
    }
);

export const budgetsSlice = createSlice({
    name: 'budgets',
    initialState,
    reducers: {
        setSelectedMonth: (state, action: PayloadAction<string>) => {
            state.selectedMonth = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBudgets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBudgets.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchBudgets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchYearlyBudgets.pending, (state) => {
                state.yearlyLoading = true;
            })
            .addCase(fetchYearlyBudgets.fulfilled, (state, action) => {
                state.yearlyLoading = false;
                state.yearly = action.payload;
            })
            .addCase(fetchYearlyBudgets.rejected, (state, action) => {
                state.yearlyLoading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteBudget.fulfilled, (state, action) => {
                state.items = state.items.filter(b => b.budget_id !== action.payload);
            });
    },
});

export const { setSelectedMonth } = budgetsSlice.actions;
export default budgetsSlice.reducer;
