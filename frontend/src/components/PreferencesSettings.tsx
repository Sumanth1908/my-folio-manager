import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSettings, updateSettings } from '../store/slices/settingsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { Card } from '../components/ui/Card';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../components/ui/Select';
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
                <h2 className="text-2xl font-black text-foreground tracking-tight uppercase tracking-tighter">Engine</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure the core behavior of your portfolio manager.</p>
            </div>

            <div className="space-y-8 max-w-xl">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Default Currency</label>
                    <p className="text-xs text-muted-foreground/60 mb-4 leading-relaxed italic">This currency will be used to display all monetary values across the application.</p>
                    <Select
                        value={settings.default_currency}
                        onValueChange={(value) => handleChange('default_currency', value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Available Currencies</SelectLabel>
                                {currencies?.map(currency => (
                                    <SelectItem key={currency.code} value={currency.code}>
                                        {currency.code} - {currency.name} ({currency.symbol})
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-8 border-t border-border/50">
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Exchange Provider</label>
                    <p className="text-xs text-muted-foreground/60 mb-4 leading-relaxed italic">Select the service used for fetching real-time currency exchange rates.</p>
                    <Select
                        value={settings.exchange_provider}
                        onValueChange={(value) => handleChange('exchange_provider', value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Providers</SelectLabel>
                                <SelectItem value="Manual">Manual (Fixed Rates)</SelectItem>
                                <SelectItem value="OpenExchangeRates">Open Exchange Rates</SelectItem>
                                <SelectItem value="Fixer">Fixer.io</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
    );
}
