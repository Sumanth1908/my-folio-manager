import { useState, type ComponentType } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Bot,
    ChartPie,
    Eye,
    Landmark,
    LayoutDashboard,
    LogOut,
    Menu,
    Moon,
    Plus,
    ReceiptText,
    Settings,
    Sparkles,
    Sun,
    WalletCards,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Tooltip } from '../ui/Tooltip';
import { cn } from '../../lib/utils';
import Assistant from '../../pages/Assistant';
import { useCreateFlow } from '../../context/CreateFlowContext';

interface NavItem {
    label: string;
    path: string;
    icon: ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Accounts', path: '/accounts', icon: Landmark },
    { label: 'Activity', path: '/activity', icon: ReceiptText },
    { label: 'Planning', path: '/planning', icon: WalletCards },
    { label: 'Wealth', path: '/wealth', icon: ChartPie },
    { label: 'Automations', path: '/automations', icon: Sparkles },
];

const mobilePrimary = navItems.slice(0, 4);

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { openCreate } = useCreateFlow();
    const location = useLocation();
    const [moreOpen, setMoreOpen] = useState(false);
    const [assistantOpen, setAssistantOpen] = useState(false);

    const isActive = (path: string) => path === '/'
        ? location.pathname === '/'
        : location.pathname === path || location.pathname.startsWith(`${path}/`);

    const themeLabel = theme === 'light' ? 'Light appearance' : theme === 'dark' ? 'Dark appearance' : 'High contrast';
    const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Eye;
    const displayName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Profile';
    const contextLabel = location.pathname === '/' ? 'Overview' : location.pathname.split('/').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' / ');

    const renderNavLink = (item: NavItem, mobile = false) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
            <Link
                key={item.path}
                to={item.path}
                onClick={() => setMoreOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                    mobile
                        ? 'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium'
                        : 'flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                    active
                        ? mobile
                            ? 'text-primary'
                            : 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
            >
                <Icon className={cn(mobile ? 'h-5 w-5' : 'h-[18px] w-[18px]', active && 'stroke-[2.25]')} />
                <span className="truncate">{item.label}</span>
            </Link>
        );
    };

    return (
        <>
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
                <Link to="/" className="flex h-20 items-center gap-3 border-b border-border px-6">
                    <img src="/logo.svg" className="h-9 w-9 object-contain" alt="" />
                    <div>
                        <div className="text-base font-semibold tracking-tight">Zenfolio</div>
                        <div className="text-xs text-muted-foreground">Financial workspace</div>
                    </div>
                </Link>

                <div className="px-3 pt-4">
                    <Button onClick={() => openCreate()} className="w-full justify-start shadow-sm">
                        <Plus /> Create
                    </Button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
                    <p className="eyebrow mb-2 px-3">Workspace</p>
                    {navItems.map((item) => renderNavLink(item))}
                    <button
                        type="button"
                        onClick={() => setAssistantOpen(true)}
                        className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <Bot className="h-[18px] w-[18px]" />
                        Assistant
                    </button>
                </nav>

                <div className="space-y-2 border-t border-border p-3">
                    <Link
                        to="/settings"
                        className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors',
                            isActive('/settings') ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                        )}
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{displayName}</span>
                            <span className="block truncate text-xs text-muted-foreground">Settings</span>
                        </span>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="ghost" size="sm" onClick={toggleTheme} className="justify-start text-muted-foreground">
                            <ThemeIcon />
                            Theme
                        </Button>
                        <Button variant="ghost" size="sm" onClick={logout} className="justify-start text-muted-foreground hover:text-destructive">
                            <LogOut />
                            Sign out
                        </Button>
                    </div>
                </div>
            </aside>

            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-md lg:hidden">
                <Link to="/" className="flex items-center gap-2.5">
                    <img src="/logo.svg" className="h-8 w-8 object-contain" alt="" />
                    <span className="font-semibold tracking-tight">Zenfolio</span>
                </Link>
                <div className="flex items-center gap-1">
                    <Tooltip content="Create">
                        <Button variant="default" size="icon" onClick={() => openCreate()} aria-label="Create">
                            <Plus />
                        </Button>
                    </Tooltip>
                    <Tooltip content={themeLabel}>
                        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={themeLabel}>
                            <ThemeIcon />
                        </Button>
                    </Tooltip>
                    <Tooltip content="Settings">
                        <Button variant="ghost" size="icon" asChild aria-label="Settings">
                            <Link to="/settings"><Settings /></Link>
                        </Button>
                    </Tooltip>
                </div>
            </header>

            <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-border bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden" aria-label="Mobile navigation">
                {mobilePrimary.map((item) => renderNavLink(item, true))}
                <button
                    type="button"
                    onClick={() => setMoreOpen(true)}
                    className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium text-muted-foreground"
                    aria-label="More navigation"
                >
                    <Menu className="h-5 w-5" />
                    <span>More</span>
                </button>
            </nav>

            <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="More" side="bottom">
                <nav className="grid gap-1" aria-label="Additional navigation">
                    {navItems.slice(4).map((item) => renderNavLink(item))}
                    <button
                        type="button"
                        onClick={() => {
                            setMoreOpen(false);
                            setAssistantOpen(true);
                        }}
                        className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <Bot className="h-[18px] w-[18px]" /> Assistant
                    </button>
                    {renderNavLink({ label: 'Settings', path: '/settings', icon: Settings })}
                </nav>
                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-5">
                    <Button variant="outline" onClick={toggleTheme}><ThemeIcon />{themeLabel}</Button>
                    <Button variant="outline" onClick={logout}><LogOut />Sign out</Button>
                </div>
            </Sheet>

            <Sheet
                open={assistantOpen}
                onOpenChange={setAssistantOpen}
                title="Financial assistant"
                description="Ask about the page you are viewing or your wider finances."
                side="right"
                className="max-w-xl"
            >
                <Assistant embedded contextLabel={contextLabel} />
            </Sheet>
        </>
    );
}
