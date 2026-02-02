import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    modals: {
        [key: string]: boolean;
    };
}

const initialState: UIState = {
    modals: {},
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        openModal: (state, action: PayloadAction<string>) => {
            state.modals[action.payload] = true;
        },
        closeModal: (state, action: PayloadAction<string>) => {
            state.modals[action.payload] = false;
        },
        toggleModal: (state, action: PayloadAction<string>) => {
            state.modals[action.payload] = !state.modals[action.payload];
        },
    },
});

export const { openModal, closeModal, toggleModal } = uiSlice.actions;
export default uiSlice.reducer;
