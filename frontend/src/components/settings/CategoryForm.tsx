import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createCategory } from '../../store/slices/categoriesSlice';
import { handleApiError } from '../../api';
import type { RootState } from '../../store';

interface CategoryFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const CategoryForm = ({ onSuccess, onCancel }: CategoryFormProps) => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState('');
    const { loading: isLoading } = useAppSelector((state: RootState) => state.categories);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(createCategory({ name })).unwrap();
            toast.success('Category created!');
            setName('');
            onSuccess();
        } catch (err: unknown) {
            toast.error(handleApiError(err, 'Failed to create category'));
        }
    }, [name, dispatch, onSuccess]);

    const isValid = !!name;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Category Identifier
                </label>
                <input
                    type="text"
                    placeholder="e.g. Wellness, Exploration"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition text-foreground placeholder:text-muted-foreground/30 font-bold"
                    autoFocus
                />
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-border/50">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Dismiss
                </Button>
                <Button type="submit" disabled={!isValid || isLoading}>
                    {isLoading ? 'Propagating...' : 'Map Category'}
                </Button>
            </div>
        </form>
    );
};

export default CategoryForm;
