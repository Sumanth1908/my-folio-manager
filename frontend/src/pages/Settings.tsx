import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2, User, Layers, Settings as SettingsIcon, Tag, Plus, Database } from 'lucide-react';
import { handleApiError } from '../api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import { PreferencesSettings } from '../components/settings/PreferencesSettings';
import { DataSettings } from '../components/settings/DataSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/utils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCategories, deleteCategory } from '../store/slices/categoriesSlice';
import type { RootState } from '../store';
import { useCreateFlow } from '../context/CreateFlowContext';

const Settings = () => {
    const { user } = useAuth();
    const dispatch = useAppDispatch();
    const { openCreate } = useCreateFlow();
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'categories' | 'preferences' | 'data'>('categories');

    // Category State
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

    const { items: categories, loading: isLoading } = useAppSelector((state: RootState) => state.categories);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;
        try {
            await dispatch(deleteCategory(categoryToDelete)).unwrap();
            toast.success('Category deleted successfully!');
            setCategoryToDelete(null);
        } catch (err) {
            toast.error(handleApiError(err, 'Failed to delete category'));
        }
    };

    return (
        <div className="page-shell">
            <PageHeader
                eyebrow="Preferences"
                title="Settings"
                description="Manage your profile, security, categories, display preferences, and data."
            />

            <div className="flex flex-col md:flex-row gap-10">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-72 flex-shrink-0">
                    <Card className="p-3 md:sticky md:top-3">
                        <nav className="flex gap-1 overflow-x-auto md:flex-col" role="tablist" aria-label="Settings sections">
                            <button
                                onClick={() => setActiveTab('general')}
                                role="tab"
                                aria-selected={activeTab === 'general'}
                                aria-controls="settings-panel"
                                className={cn(
                                    "flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                    activeTab === 'general'
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <User size={18} />
                                General
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                role="tab"
                                aria-selected={activeTab === 'security'}
                                aria-controls="settings-panel"
                                className={cn(
                                    "flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                    activeTab === 'security'
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <Shield size={18} />
                                Security
                            </button>
                            <button
                                onClick={() => setActiveTab('categories')}
                                role="tab"
                                aria-selected={activeTab === 'categories'}
                                aria-controls="settings-panel"
                                className={cn(
                                    "flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                    activeTab === 'categories'
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <Layers size={18} />
                                Categories
                            </button>
                            <button
                                onClick={() => setActiveTab('preferences')}
                                role="tab"
                                aria-selected={activeTab === 'preferences'}
                                aria-controls="settings-panel"
                                className={cn(
                                    "flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                    activeTab === 'preferences'
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <SettingsIcon size={18} />
                                Preferences
                            </button>
                            <button
                                onClick={() => setActiveTab('data')}
                                role="tab"
                                aria-selected={activeTab === 'data'}
                                aria-controls="settings-panel"
                                className={cn(
                                    "flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                                    activeTab === 'data'
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <Database size={18} />
                                Data
                            </button>
                        </nav>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="min-w-0 flex-1" id="settings-panel" role="tabpanel">
                    {activeTab === 'general' && (
                        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Identity</h2>
                                <p className="text-sm text-muted-foreground mt-1 lowercase">Your verified profile details</p>
                            </div>

                            <div className="space-y-6 max-w-lg">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Display Name</label>
                                    <div className="text-lg font-black text-foreground p-4 bg-muted/30 rounded-2xl border border-border/50 transition hover:bg-muted/50">
                                        {user?.full_name || 'Anonymous User'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Email Endpoint</label>
                                    <div className="text-lg font-black text-foreground p-4 bg-muted/30 rounded-2xl border border-border/50 transition hover:bg-muted/50">
                                        {user?.email}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-border/50">
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Build Artifacts</div>
                                <p className="text-[10px] font-bold text-primary/50 mt-1 uppercase tracking-widest">Version 2.0.0-PRO (SHADCN/UI)</p>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'security' && <SecuritySettings />}

                    {activeTab === 'categories' && (
                        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground tracking-tight">Categories</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">Create and manage labels for financial activity.</p>
                                </div>
                                <Button
                                    onClick={() => openCreate('category')}
                                    size="icon"
                                    className="h-12 w-12 rounded-full shadow-lg shadow-primary/20"
                                >
                                    <Plus size={24} />
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="py-20 flex flex-col items-center gap-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hydrating categories...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {categories?.map(category => (
                                        <div
                                            key={category.category_id}
                                            className="group flex items-center justify-between px-5 py-4 bg-muted/30 border border-border/50 rounded-2xl hover:bg-muted/50 hover:border-primary/20 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                                <span className="text-sm font-black text-foreground tracking-tight">{category.name}</span>
                                            </div>
                                            <button
                                                onClick={() => setCategoryToDelete(category.category_id)}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {categories?.length === 0 && (
                                        <div className="col-span-full py-20 bg-muted/10 rounded-3xl border border-dashed border-border text-center">
                                            <Tag className="mx-auto text-muted-foreground/30 mb-4" size={40} />
                                            <p className="text-sm font-medium text-muted-foreground">No categories yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    )}

                    {activeTab === 'preferences' && <PreferencesSettings />}

                    {activeTab === 'data' && <DataSettings />}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                title="Delete Category"
                message="Are you sure you want to delete this category? Transactions using this category may obtain a NULL category."
                variant="danger"
                onConfirm={handleDeleteCategory}
            />
        </div>
    );
}

export default Settings;
