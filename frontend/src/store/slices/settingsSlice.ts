import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import api from '../../api';
import type { UserSettings } from '../../types';

interface SettingsState {
    data: UserSettings | null;
    loading: boolean;
    error: string | null;
}

const initialState: SettingsState = {
    data: null,
    loading: false,
    error: null,
};

export const fetchSettings = createAsyncThunk(
    'settings/fetchSettings',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/settings/');
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch settings');
        }
    }
);

export const updateSettings = createAsyncThunk(
    'settings/updateSettings',
    async (newSettings: UserSettings, { rejectWithValue }) => {
        try {
            const res = await api.put('/settings/', newSettings);
            return res.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
        }
    }
);

export const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<UserSettings>) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateSettings.fulfilled, (state, action: PayloadAction<UserSettings>) => {
                state.data = action.payload;
            });
    },
});

export default settingsSlice.reducer;
