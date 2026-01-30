import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="relative">
                {/* Decorative background element */}
                <div className="absolute -inset-10 bg-gradient-to-r from-primary/20 to-purple-500/20 blur-3xl opacity-50 -z-10" />

                <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-foreground/5 select-none text-center">
                    404
                </h1>

                <div className="text-center space-y-4 -mt-10 md:-mt-16">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
                        Lost in Space
                    </h2>
                    <p className="text-muted-foreground font-bold text-sm md:text-base max-w-sm mx-auto leading-relaxed">
                        The page you are looking for has been moved, deleted, or never existed in this dimension.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full max-w-xs sm:max-w-none justify-center">
                <Button
                    variant="secondary"
                    onClick={() => navigate(-1)}
                    className="gap-2 h-12 px-8 rounded-2xl group transition-all"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Go Back
                </Button>
                <Button
                    onClick={() => navigate('/')}
                    className="gap-2 h-12 px-8 rounded-2xl shadow-xl shadow-primary/20 group transition-all hover:scale-105"
                >
                    <Home className="w-4 h-4" />
                    Return Home
                </Button>
            </div>

            {/* Subtle Footer Suggestion */}
            <p className="mt-16 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                My Folio Manager
            </p>
        </div>
    );
}
