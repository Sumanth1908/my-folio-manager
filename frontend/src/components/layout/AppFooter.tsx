import { Link } from 'react-router-dom';

export default function AppFooter() {
    return (
        <footer className="mt-12 border-t border-border py-6 text-xs text-muted-foreground">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} Zenfolio · Personal finance workspace</p>
                <div className="flex items-center gap-3">
                    <span>Version 2.0.0</span>
                    <span aria-hidden="true">·</span>
                    <Link to="/settings" className="hover:text-foreground">Data management</Link>
                </div>
            </div>
        </footer>
    );
}
