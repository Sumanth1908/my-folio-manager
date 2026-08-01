import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createCategory } from '../../store/slices/categoriesSlice';
import { handleApiError } from '../../api';
import type { RootState } from '../../store';
import { Input } from '../ui/Input';

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
                <label className="mb-2 block text-xs font-semibold text-muted-foreground" htmlFor="category-name">
                    Category name
                </label>
                <Input
                    id="category-name"
                    type="text"
                    placeholder="For example, Wellness"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-border/50">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!isValid || isLoading}>
                    {isLoading ? 'Creating...' : 'Create category'}
                </Button>
            </div>
        </form>
    );
};

export default CategoryForm;
