import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await register(email, password, fullName);
            navigate('/');
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
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="py-8 px-4 sm:px-10">
                    <CardHeader className="p-0 pb-6">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                            Fill in your details
                        </p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground/40 text-foreground transition"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground/40 text-foreground transition"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground/40 text-foreground transition"
                                    placeholder="••••••••"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full shadow-lg shadow-primary/20"
                                isLoading={isLoading}
                            >
                                Create Account
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
