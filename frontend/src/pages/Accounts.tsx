import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, TrendingUp } from 'lucide-react';
import api, { handleApiError } from '../api';
import type { Currency } from '../types';
import Modal from '../components/Modal';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import SavingsAccountCard from '../components/account/SavingsAccountCard';
import InvestmentAccountCard from '../components/account/InvestmentAccountCard';
import LoanAccountCard from '../components/account/LoanAccountCard';
import FDAccountCard from '../components/account/FDAccountCard';

export default function Accounts() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [newAccountName, setNewAccountName] = useState('');
    const [accountType, setAccountType] = useState('Savings');
    const [currency, setCurrency] = useState('USD');

    // Savings Specific State
    const [savingsInterestRate, setSavingsInterestRate] = useState('');
    const [savingsMinBalance, setSavingsMinBalance] = useState('');
    const [savingsAccrualDay, setSavingsAccrualDay] = useState('1');

    // Loan Specific State
    const [loanAmount, setLoanAmount] = useState('');
    const [loanInterestRate, setLoanInterestRate] = useState('');
    const [loanTenure, setLoanTenure] = useState('');
    const [loanEMI, setLoanEMI] = useState('');
    const [loanAccrualDay, setLoanAccrualDay] = useState('1');

    // Fixed Deposit Specific State
    const [fdPrincipal, setFdPrincipal] = useState('');
    const [fdInterestRate, setFdInterestRate] = useState('');
    const [fdStartDate, setFdStartDate] = useState('');
    const [fdMaturityDate, setFdMaturityDate] = useState('');
    const [fdMaturityAmount, setFdMaturityAmount] = useState('');
    const [fdAccrualDay, setFdAccrualDay] = useState('1');

    // Auto-calculate EMI or Tenure
    useEffect(() => {
        if (accountType !== 'Loan') return;

        const P = parseFloat(loanAmount);
        const R_annual = parseFloat(loanInterestRate);
        const T_months = parseFloat(loanTenure);

        // Calculate EMI if P, R, T are present
        if (P && R_annual && T_months) {
            const R = R_annual / 12 / 100;
            const emi = (P * R * Math.pow(1 + R, T_months)) / (Math.pow(1 + R, T_months) - 1);
            if (!document.activeElement?.getAttribute('placeholder')?.includes('calculated')) {
                setLoanEMI(emi.toFixed(2));
            }
        }
    }, [loanAmount, loanInterestRate, loanTenure, accountType]);

    // Auto-calculate FD Maturity Amount
    useEffect(() => {
        if (accountType !== 'Fixed Deposit') return;

        const P = parseFloat(fdPrincipal);
        const R = parseFloat(fdInterestRate);

        if (P && R && fdStartDate && fdMaturityDate) {
            const start = new Date(fdStartDate);
            const end = new Date(fdMaturityDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffYears = diffDays / 365;

            if (diffDays > 0) {
                // Simple Interest Formula: A = P(1 + rt)
                const interest = P * (R / 100) * diffYears;
                const maturity = P + interest;
                if (!document.activeElement?.getAttribute('placeholder')?.includes('0.00')) {
                    setFdMaturityAmount(maturity.toFixed(2));
                }
            }
        }
    }, [fdPrincipal, fdInterestRate, fdStartDate, fdMaturityDate, accountType]);

    const { data: accounts } = useAccounts();

    const { data: currencies } = useQuery<Currency[]>({
        queryKey: ['currencies'],
        queryFn: async () => {
            const res = await api.get('/currencies/');
            return res.data;
        }
    });

    const { data: allTransactions } = useTransactions();

    const createAccountMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/accounts/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            closeModal();
        }
    });

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newAccountName) {
            const payload: any = {
                account_name: newAccountName,
                account_type: accountType,
                currency: currency,
                status: 'Active'
            };

            if (accountType === 'Savings') {
                payload.savings_account = {
                    balance: 0,
                    interest_rate: savingsInterestRate ? parseFloat(savingsInterestRate) : null,
                    min_balance: savingsMinBalance ? parseFloat(savingsMinBalance) : 0,
                    interest_accrual_day: parseInt(savingsAccrualDay)
                };
            } else if (accountType === 'Loan') {
                payload.loan_account = {
                    loan_amount: parseFloat(loanAmount),
                    outstanding_amount: parseFloat(loanAmount), // Initially same as loan amount
                    interest_rate: parseFloat(loanInterestRate),
                    tenure_months: parseInt(loanTenure),
                    emi_amount: parseFloat(loanEMI),
                    start_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
                    interest_accrual_day: parseInt(loanAccrualDay)
                };
            } else if (accountType === 'Fixed Deposit') {
                payload.fixed_deposit_account = {
                    principal_amount: parseFloat(fdPrincipal),
                    interest_rate: parseFloat(fdInterestRate),
                    start_date: fdStartDate,
                    maturity_date: fdMaturityDate,
                    maturity_amount: parseFloat(fdMaturityAmount),
                    interest_accrual_day: parseInt(fdAccrualDay)
                };
            }

            const promise = createAccountMutation.mutateAsync(payload);

            await toast.promise(promise, {
                loading: 'Creating account...',
                success: 'Account created successfully!',
                error: (err) => handleApiError(err, 'Failed to create account')
            });
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewAccountName('');
        setAccountType('Savings');
        setCurrency('USD');
        setSavingsInterestRate('');
        setSavingsMinBalance('');
        setSavingsAccrualDay('1');
        setLoanAmount('');
        setLoanInterestRate('');
        setLoanTenure('');
        setLoanEMI('');
        setLoanAccrualDay('1');
        setFdPrincipal('');
        setFdInterestRate('');
        setFdStartDate('');
        setFdMaturityDate('');
        setFdMaturityAmount('');
        setFdAccrualDay('1');
    };

    const getAccountBalance = (accountId: string) => {
        if (!allTransactions?.pages) return 0;
        const items = allTransactions.pages.flatMap(page => page.items);
        return items
            .filter(tx => tx.account_id === accountId)
            .reduce((balance, tx) => {
                return tx.transaction_type === 'Credit' ? balance + tx.amount : balance - tx.amount;
            }, 0);
    };

    const getCurrencySymbol = (code: string) => {
        return currencies?.find(c => c.code === code)?.symbol || '$';
    };

    // Lazy import or just standard import. Let's add it to top if possible, but replace_file_content is block based.
    // I will check imports first.




    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <Card className="p-8 border-border/50 bg-background/50 backdrop-blur-xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Accounts</h1>
                    <Button
                        size="icon"
                        className="rounded-full h-12 w-12 shadow-md hover:bg-primary/90 transition-colors"
                        onClick={() => setIsModalOpen(true)}
                        title="New Account"
                    >
                        <Plus size={24} />
                    </Button>
                </div>

                <div className="space-y-12">
                    {/* Assets Section */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6 flex items-center gap-2">
                            <span className="bg-primary/10 text-primary p-2 rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </span>
                            Assets & Investments
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accounts?.items.filter(a => a.account_type !== 'Loan').map(account => {
                                const balance = getAccountBalance(account.account_id);
                                const symbol = getCurrencySymbol(account.currency);

                                if (account.account_type === 'Savings') {
                                    return (
                                        <SavingsAccountCard
                                            key={account.account_id}
                                            account={account}
                                            balance={balance}
                                            symbol={symbol}
                                            onClick={() => navigate(`/accounts/${account.account_id}`)}
                                        />
                                    );
                                } else if (account.account_type === 'Fixed Deposit') {
                                    return (
                                        <FDAccountCard
                                            key={account.account_id}
                                            account={account}
                                            balance={balance}
                                            symbol={symbol}
                                            onClick={() => navigate(`/accounts/${account.account_id}`)}
                                        />
                                    );
                                } else {
                                    return (
                                        <InvestmentAccountCard
                                            key={account.account_id}
                                            account={account}
                                            balance={balance}
                                            symbol={symbol}
                                            onClick={() => navigate(`/accounts/${account.account_id}`)}
                                        />
                                    );
                                }
                            })}

                            {accounts?.items.filter(a => a.account_type !== 'Loan').length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border/50">
                                    No asset accounts found. Create one to get started!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Liabilities Section */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6 flex items-center gap-2">
                            <span className="bg-destructive/10 text-destructive p-2 rounded-xl">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                            Liabilities & Loans
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {accounts?.items.filter(a => a.account_type === 'Loan').map(account => {
                                const symbol = getCurrencySymbol(account.currency);

                                return (
                                    <LoanAccountCard
                                        key={account.account_id}
                                        account={account}
                                        symbol={symbol}
                                        onClick={() => navigate(`/accounts/${account.account_id}`)}
                                    />
                                );
                            })}

                            {accounts?.items.filter(a => a.account_type === 'Loan').length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border/50">
                                    No loan accounts found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Create New Account" maxWidth="max-w-3xl">
                <form onSubmit={handleCreateAccount} className="space-y-4">
                    {/* Two Column Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Basic Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Vacation Fund"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition placeholder:text-muted-foreground/50"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account Type</label>
                                <select
                                    value={accountType}
                                    onChange={(e) => setAccountType(e.target.value)}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                >
                                    <option value="Savings" className="bg-background">Savings</option>
                                    <option value="Investment" className="bg-background">Investment</option>
                                    <option value="Loan" className="bg-background">Loan</option>
                                    <option value="Fixed Deposit" className="bg-background">Fixed Deposit</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                >
                                    {currencies?.map(curr => (
                                        <option key={curr.code} value={curr.code} className="bg-background">
                                            {curr.symbol} {curr.name} ({curr.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Right Column - Additional Details */}
                        <div>
                            {accountType === 'Savings' && (
                                <div className="bg-muted/30 p-5 rounded-2xl space-y-5 border border-border h-full">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/70 border-b border-border pb-3">Savings Details</h4>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Rate (% APY)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="e.g. 4.5"
                                            value={savingsInterestRate}
                                            onChange={(e) => setSavingsInterestRate(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition placeholder:text-muted-foreground/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Min Balance</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={savingsMinBalance}
                                            onChange={(e) => setSavingsMinBalance(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition placeholder:text-muted-foreground/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Accrual Day <span className="text-[10px] text-muted-foreground/50 lowercase italic">(Day of month)</span></label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            placeholder="1"
                                            value={savingsAccrualDay}
                                            onChange={(e) => setSavingsAccrualDay(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                        />
                                    </div>
                                </div>
                            )}

                            {accountType === 'Loan' && (
                                <div className="bg-muted/30 p-5 rounded-2xl space-y-5 border border-border h-full">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/70 border-b border-border pb-3">Loan Details</h4>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Loan Amount</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={loanAmount}
                                            onChange={(e) => setLoanAmount(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition placeholder:text-muted-foreground/30"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Rate (%/yr)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="10.5"
                                            value={loanInterestRate}
                                            onChange={(e) => setLoanInterestRate(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tenure <span className="text-[10px] text-muted-foreground/50 lowercase italic">(Months)</span></label>
                                            <input
                                                type="number"
                                                placeholder="12"
                                                value={loanTenure}
                                                onChange={(e) => setLoanTenure(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">EMI</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="calculated"
                                                value={loanEMI}
                                                onChange={(e) => setLoanEMI(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">EMI Day <span className="text-[10px] text-muted-foreground/50 lowercase italic">(Day of month)</span></label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="31"
                                            placeholder="1"
                                            value={loanAccrualDay}
                                            onChange={(e) => setLoanAccrualDay(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                        />
                                    </div>

                                    {(loanEMI && loanTenure && loanAmount) && (
                                        <div className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 p-4 rounded-xl border border-primary/20">
                                            Total Payable: <span className="text-lg font-black ml-2 tabular-nums">{((parseFloat(loanEMI) * parseFloat(loanTenure))).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {accountType === 'Fixed Deposit' && (
                                <div className="bg-muted/30 p-5 rounded-2xl space-y-5 border border-border h-full">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/70 border-b border-border pb-3">Fixed Deposit Details</h4>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Principal Amount</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={fdPrincipal}
                                            onChange={(e) => setFdPrincipal(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition placeholder:text-muted-foreground/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Rate (% p.a.)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="6.5"
                                            value={fdInterestRate}
                                            onChange={(e) => setFdInterestRate(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={fdStartDate}
                                                onChange={(e) => setFdStartDate(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Date</label>
                                            <input
                                                type="date"
                                                value={fdMaturityDate}
                                                onChange={(e) => setFdMaturityDate(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Amount</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={fdMaturityAmount}
                                                onChange={(e) => setFdMaturityAmount(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Accrual Day</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                placeholder="1"
                                                value={fdAccrualDay}
                                                onChange={(e) => setFdAccrualDay(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {accountType === 'Investment' && (
                                <div className="bg-muted/30 p-5 rounded-2xl border border-border h-full flex items-center justify-center">
                                    <p className="text-muted-foreground text-sm text-center">No additional details required for Investment accounts</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="pt-6 flex justify-end gap-3 border-t border-border/50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                !newAccountName ||
                                (accountType === 'Loan' && (!loanAmount || !loanInterestRate)) ||
                                (accountType === 'Fixed Deposit' && (!fdPrincipal || !fdInterestRate || !fdStartDate || !fdMaturityDate || !fdMaturityAmount))
                            }
                        >
                            Create Account
                        </Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
}
