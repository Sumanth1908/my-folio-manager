
export default function LoadingSpinner({ size = 'medium', className = '' }: { size?: 'small' | 'medium' | 'large', className?: string }) {
    const sizeClasses = {
        small: 'w-4 h-4 border-2',
        medium: 'w-8 h-8 border-3',
        large: 'w-12 h-12 border-4'
    };

    return (
        <div className={`flex justify-center items-center ${className}`}>
            <div
                className={`${sizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin`}
                role="status"
                aria-label="Loading"
            ></div>
        </div>
    );
}
