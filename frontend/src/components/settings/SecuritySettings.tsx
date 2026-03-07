import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import api, { handleApiError } from '../../api';

export const SecuritySettings = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }
        
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword
            });
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(handleApiError(error, 'Failed to update password'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
            <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Security</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage your password and authentication.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg pt-4 border-t border-border/50">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Current Password
                    </label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full text-foreground p-3 bg-muted/50 rounded-xl border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition"
                        placeholder="••••••••"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        New Password
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-foreground p-3 bg-muted/50 rounded-xl border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition"
                        placeholder="••••••••"
                        required
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-foreground p-3 bg-muted/50 rounded-xl border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <div className="pt-2">
                    <Button 
                        type="submit" 
                        disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                        className="w-full sm:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};
