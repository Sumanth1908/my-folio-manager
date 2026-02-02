import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { searchStockSymbols } from '../../../store/slices/holdingsSlice';
import { Search, TrendingUp } from 'lucide-react';

interface StockSymbolInputProps {
    value: string;
    name: string;
    currency: string;
    disabled?: boolean;
    onSelect: (symbol: string, name: string) => void;
}

interface StockSymbolResult {
    symbol: string;
    name: string;
    exchange: string;
}

const StockSymbolInput = ({ value, currency, disabled, onSelect }: StockSymbolInputProps) => {
    const dispatch = useAppDispatch();
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<StockSymbolResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const debounceTimerRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 1) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        try {
            const result = await dispatch(searchStockSymbols({
                query: searchQuery,
                currency
            })).unwrap();
            setSuggestions(result || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Search failed:', error);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, [dispatch, currency]);

    // Handle input change with debounce
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.toUpperCase();
        setQuery(newValue);

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            performSearch(newValue);
        }, 300);
    };

    const handleSelectSuggestion = (suggestion: StockSymbolResult) => {
        setQuery(suggestion.symbol);
        onSelect(suggestion.symbol, suggestion.name);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleFocus = () => {
        if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Stock Symbol
            </label>
            <div className="relative">
                <input
                    type="text"
                    required
                    placeholder="e.g. AAPL, RELIANCE"
                    disabled={disabled}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    className="w-full p-3 pl-10 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:opacity-50"
                />
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 group"
                        >
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition">
                                <TrendingUp size={16} className="text-primary" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-sm text-foreground">{suggestion.symbol}</div>
                                <div className="text-xs text-muted-foreground truncate">{suggestion.name}</div>
                            </div>
                            <div className="text-[10px] font-bold bg-muted px-2 py-1 rounded uppercase tracking-wider text-muted-foreground">
                                {suggestion.exchange}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {showSuggestions && query.length > 0 && suggestions.length === 0 && !isSearching && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg p-4 text-center text-muted-foreground text-sm">
                    No symbols found. You can still enter the symbol manually.
                </div>
            )}
        </div>
    );
};

export default StockSymbolInput;
