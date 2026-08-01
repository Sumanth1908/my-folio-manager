import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/utils';
import api from '../api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

interface AssistantProps {
    embedded?: boolean;
    contextLabel?: string;
}

export default function Assistant({ embedded = false, contextLabel }: AssistantProps) {
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

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Build conversation history for context
            const conversationHistory = updatedMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await api.post('/assistant/chat', {
                message: userMessage.content,
                conversation_history: conversationHistory.slice(0, -1) // Exclude the just-sent message
            });

            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: response.data.response,
            }]);
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || 'Sorry, I encountered an error. Please try again.';
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `⚠️ ${errorMessage}`,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn('flex flex-col', embedded ? 'h-[calc(100vh-8.5rem)]' : 'page-shell min-h-[calc(100vh-7rem)]')}>
            {!embedded && (
                <PageHeader
                    eyebrow="Ask Zenfolio"
                    title="Financial assistant"
                    description="Ask about your portfolio, accounts, spending, and financial plan."
                />
            )}

            {embedded && contextLabel && (
                <p className="mb-3 text-xs text-muted-foreground">Using context from <span className="font-semibold text-foreground">{contextLabel}</span></p>
            )}

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
                    className={cn('flex-1 space-y-4 overflow-y-auto p-4 sm:p-6', embedded ? 'min-h-0' : 'min-h-[400px] max-h-[calc(100vh-320px)]')}
                >
                    <div ref={messagesStartRef} />

                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <Bot className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Start a conversation</h3>
                            <p className="text-muted-foreground text-sm max-w-md mb-6">
                                Ask me about your portfolio performance, spending patterns, budgeting tips, or any other financial questions.
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                                {[
                                    "What's my total balance across all accounts?",
                                    "Show me my spending by category this month",
                                    "How is my investment portfolio performing?",
                                    "What are my recent transactions?",
                                ].map((prompt) => (
                                    <button
                                        key={prompt}
                                        onClick={() => setInput(prompt)}
                                        className="px-3 py-2 text-xs bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
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
                        <Input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your finances..."
                            containerClassName="flex-1"
                            className="h-12"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="h-12 w-12 rounded-xl"
                            aria-label="Send message"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
