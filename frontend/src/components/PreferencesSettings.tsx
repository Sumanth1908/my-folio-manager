import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSettings, updateSettings } from '../store/slices/settingsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card } from '../components/ui/Card';
import type { RootState } from '../store';
import type { UserSettings } from '../types';

export function PreferencesSettings() {
    const dispatch = useAppDispatch();
    const { data: settings, loading: isSettingsLoading } = useAppSelector((state: RootState) => state.settings);
    const { items: currencies, loading: isCurrenciesLoading } = useAppSelector((state: RootState) => state.currencies);

    useEffect(() => {
        dispatch(fetchSettings());
        dispatch(fetchCurrencies());
    }, [dispatch]);

    if (isSettingsLoading || isCurrenciesLoading || !settings) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    const handleChange = (key: keyof UserSettings, value: string) => {
        dispatch(updateSettings({ ...settings, [key]: value }));
    };

    return (
        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
            <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight uppercase tracking-tighter italic">Engine</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure the core behavior of your portfolio manager.</p>
            </div>

            <div className="space-y-8 max-w-xl">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Default Currency</label>
                    <p className="text-xs text-muted-foreground/60 mb-4 leading-relaxed italic">This currency will be used to display all monetary values across the application.</p>
                    <select
                        value={settings.default_currency}
                        onChange={(e) => handleChange('default_currency', e.target.value)}
                        className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition text-foreground font-bold appearance-none cursor-pointer hover:bg-muted/30"
                    >
                        {currencies?.map(currency => (
                            <option key={currency.code} value={currency.code} className="bg-background">
                                {currency.code} - {currency.name} ({currency.symbol})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="pt-8 border-t border-border/50">
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Exchange Provider</label>
                    <p className="text-xs text-muted-foreground/60 mb-4 leading-relaxed italic">Select the service used for fetching real-time currency exchange rates.</p>
                    <select
                        value={settings.exchange_provider}
                        onChange={(e) => handleChange('exchange_provider', e.target.value)}
                        className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition text-foreground font-bold appearance-none cursor-pointer hover:bg-muted/30"
                    >
                        <option value="Manual" className="bg-background">Manual (Fixed Rates)</option>
                        <option value="OpenExchangeRates" className="bg-background">Open Exchange Rates</option>
                        <option value="Fixer" className="bg-background">Fixer.io</option>
                    </select>
                </div>
            </div>
        </Card>
    );
}
