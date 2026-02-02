import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import accountsReducer from './slices/accountsSlice';
import transactionsReducer from './slices/transactionsSlice';
import rulesReducer from './slices/rulesSlice';
import currenciesReducer from './slices/currenciesSlice';
import summaryReducer from './slices/summarySlice';
import settingsReducer from './slices/settingsSlice';
import converterReducer from './slices/converterSlice';
import categoriesReducer from './slices/categoriesSlice';
import holdingsReducer from './slices/holdingsSlice';
import portfolioReducer from './slices/portfolioSlice';

export const store = configureStore({
    reducer: {
        ui: uiReducer,
        accounts: accountsReducer,
        transactions: transactionsReducer,
        rules: rulesReducer,
        currencies: currenciesReducer,
        summary: summaryReducer,
        settings: settingsReducer,
        converter: converterReducer,
        categories: categoriesReducer,
        holdings: holdingsReducer,
        portfolio: portfolioReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
