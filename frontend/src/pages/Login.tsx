import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const nextParam = new URLSearchParams(location.search).get('next');
    const from = nextParam || location.state?.from?.pathname || '/dashboard';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' }
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            await login(data.email, data.password);
            navigate(from, { replace: true });
        } catch (error) {
            // Error handled in AuthContext
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <img src="/logo.svg" className="h-20 w-auto object-contain animate-in fade-in zoom-in duration-1000" alt="My Folio Manager" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-black text-foreground tracking-tight">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Or{' '}
                    <Link to="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="py-8 px-4 sm:px-10">
                    <CardHeader className="p-0 pb-6">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Enter your credentials
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                            <div>
                                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground/40 text-foreground transition"
                                    placeholder="you@example.com"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground/40 text-foreground transition"
                                    placeholder="••••••••"
                                    {...register('password')}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full shadow-lg shadow-primary/20"
                                isLoading={isLoading}
                            >
                                Sign in
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
