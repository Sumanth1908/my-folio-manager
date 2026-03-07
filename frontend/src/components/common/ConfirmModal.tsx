import { Button } from '../ui/Button';
import Modal from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    isLoading = false
}: ConfirmModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{message}</p>
                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === 'danger' ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        disabled={isLoading}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default ConfirmModal;
