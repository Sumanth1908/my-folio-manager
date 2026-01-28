import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import type { UserSettings } from '../types';
import toast from 'react-hot-toast';
import { useMemo } from 'react';

export function useSettings() {
    const queryClient = useQueryClient();

    const { data: settings, isLoading, error } = useQuery<UserSettings>({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await api.get('/settings/');
            return res.data;
        }
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings: UserSettings) => {
            const res = await api.put('/settings/', newSettings);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['settings'], data);
            toast.success('Settings updated successfully');
        },
        onError: (err) => {
            console.error('Failed to update settings:', err);
            toast.error('Failed to update settings');
        }
    });

    return useMemo(() => ({
        settings,
        isLoading,
        error,
        updateSettings: updateSettingsMutation.mutate,
        isUpdating: updateSettingsMutation.isPending
    }), [settings, isLoading, error, updateSettingsMutation.mutate, updateSettingsMutation.isPending]);
}
