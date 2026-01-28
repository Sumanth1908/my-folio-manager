import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User as UserIcon, Sun, Moon, Eye } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const navItems = [
        { label: 'Accounts', path: '/accounts' },
        { label: 'Activity', path: '/transactions' },
        { label: 'Portfolio', path: '/portfolio' },
    ];

    return (
        <nav className="bg-background/80 border-b border-border backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-primary p-2 rounded-xl group-hover:rotate-12 transition-transform">
                            <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-xl font-black text-foreground tracking-tighter uppercase italic">Folio</span>
                    </Link>

                    <div className="flex items-center space-x-1 md:space-x-4">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Button
                                    key={item.path}
                                    variant={isActive ? "secondary" : "ghost"}
                                    asChild
                                    className={cn(
                                        "font-bold transition-all duration-300",
                                        isActive ? "bg-accent text-accent-foreground shadow-sm px-5" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Link to={item.path}>{item.label}</Link>
                                </Button>
                            );
                        })}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-xl text-muted-foreground hover:text-foreground"
                            title={theme === 'dark' ? 'Switch to high contrast' : theme === 'high-contrast' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : theme === 'high-contrast' ? <Eye size={20} /> : <Moon size={20} />}
                        </Button>

                        <div className="h-6 w-px bg-border mx-2 hidden md:block"></div>

                        <div className="flex items-center gap-1 md:gap-3 bg-muted/50 p-1.5 rounded-2xl border border-border">
                            <Button
                                variant={location.pathname === '/settings' ? "secondary" : "ghost"}
                                size="sm"
                                asChild
                                className={cn(
                                    "gap-2 px-3",
                                    location.pathname === '/settings' && "bg-accent text-accent-foreground shadow-sm"
                                )}
                            >
                                <Link to="/settings">
                                    <UserIcon className={cn("h-4 w-4", location.pathname === '/settings' ? "text-primary" : "text-muted-foreground")} />
                                    <span className="font-bold hidden sm:inline">{user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}</span>
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={logout}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive transition"
                                title="Sign out"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
