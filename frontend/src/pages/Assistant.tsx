import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function Assistant() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollButtons, setShowScrollButtons] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesStartRef = useRef<HTMLDivElement>(null);

    const checkScrollable = () => {
        const container = messagesContainerRef.current;
        if (container) {
            setShowScrollButtons(container.scrollHeight > container.clientHeight);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        checkScrollable();
    }, [messages]);

    useEffect(() => {
        checkScrollable();
        window.addEventListener('resize', checkScrollable);
        return () => window.removeEventListener('resize', checkScrollable);
    }, []);

    const scrollToTop = () => {
        messagesStartRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input.trim(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Simulate response - replace with actual API call
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `You asked: "${userMessage.content}". Connect me to your AI backend to get real financial insights!`,
            }]);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen flex flex-col pb-20">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
                    Financial Assistant
                </h1>
                <p className="text-muted-foreground text-sm">
                    Ask anything about your portfolio and spending
                </p>
            </div>

            {/* Chat Container */}
            <div className="flex-1 flex flex-col bg-card/50 rounded-2xl border border-border overflow-hidden relative">
                {/* Scroll Navigation Buttons */}
                {showScrollButtons && messages.length > 0 && (
                    <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={scrollToTop}
                            className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-sm"
                            title="Scroll to top"
                        >
                            <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={scrollToBottom}
                            className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-sm"
                            title="Scroll to bottom"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Messages - Scrollable Container */}
                <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4"
                    style={{ maxHeight: 'calc(100vh - 320px)', minHeight: '400px' }}
                >
                    <div ref={messagesStartRef} />

                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <Bot className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Start a conversation</h3>
                            <p className="text-muted-foreground text-sm max-w-md">
                                Ask me about your portfolio performance, spending patterns, budgeting tips, or any other financial questions.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-3",
                                    msg.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-primary" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[70%] px-4 py-3 rounded-xl text-sm",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                    )}
                                >
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-primary" />
                            </div>
                            <div className="bg-muted px-4 py-3 rounded-xl">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background/50">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your finances..."
                            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="h-12 w-12 rounded-xl"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
