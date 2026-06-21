import re

with open('frontend/src/components/account/common/CreateAccountForm.tsx', 'r') as f:
    content = f.read()

# 1. Add Repeat to lucide-react imports
content = content.replace("from 'lucide-react';", ", Repeat } from 'lucide-react';")
content = content.replace("PiggyBank, TrendingUp, Landmark, ShieldCheck,", "PiggyBank, TrendingUp, Landmark, ShieldCheck")

# 2. Add ACCOUNT_TYPE_CONFIG entry
config_entry = """    {
        id: ACCOUNT_TYPE.RECURRING_DEPOSIT,
        title: 'Recurring Deposit',
        description: 'Periodic deposits with fixed returns.',
        icon: Repeat,
        color: 'text-indigo-500'
    }
];"""
content = content.replace("];", config_entry, 1)

# 3. Add Accounts selector
content = content.replace("const { items: currencies } = useAppSelector((state: RootState) => state.currencies);", 
"""const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);""")

# 4. Add RD state
rd_state = """    // Recurring Deposit Specific State
    const [rdDepositAmount, setRdDepositAmount] = useState('');
    const [rdInterestRate, setRdInterestRate] = useState('');
    const [rdTenure, setRdTenure] = useState('');
    const [rdStartDate, setRdStartDate] = useState('');
    const [rdMaturityDate, setRdMaturityDate] = useState('');
    const [rdMaturityAmount, setRdMaturityAmount] = useState('');
    const [rdIsAutoDeposit, setRdIsAutoDeposit] = useState(false);
    const [rdLinkedAccountId, setRdLinkedAccountId] = useState('');
    const [rdDepositDay, setRdDepositDay] = useState(DEFAULT_ACCRUAL_DAY);"""
content = content.replace("// Fixed Deposit Specific State", rd_state + "\n\n    // Fixed Deposit Specific State")

# 5. Enable interest effect
content = content.replace("} else if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT) {", 
"} else if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT || accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT) {")

# 6. Add RD effect for maturity date calculation based on tenure
rd_effect = """
    useEffect(() => {
        if (accountType !== ACCOUNT_TYPE.RECURRING_DEPOSIT) return;
        if (rdStartDate && rdTenure) {
            const start = new Date(rdStartDate);
            start.setMonth(start.getMonth() + parseInt(rdTenure));
            if (!document.activeElement?.getAttribute('placeholder')?.includes('date')) {
                setRdMaturityDate(start.toISOString().split('T')[0]);
            }
        }
        
        const P = parseFloat(rdDepositAmount);
        const R = parseFloat(rdInterestRate) / 100;
        const n = parseInt(rdTenure);
        
        if (P && R && n) {
            // simple estimation of RD maturity: P * n + P * n * (n+1) / 24 * R
            const principal = P * n;
            const interest = P * n * (n + 1) / 24 * R;
            const maturity = principal + interest;
            if (!document.activeElement?.getAttribute('placeholder')?.includes('0.00')) {
                setRdMaturityAmount(maturity.toFixed(2));
            }
        }
    }, [rdDepositAmount, rdInterestRate, rdTenure, rdStartDate, accountType]);"""
content = content.replace("    const handleCreateAccount", rd_effect + "\n\n    const handleCreateAccount")

# 7. handleCreateAccount metadata
rd_metadata = """            } else if (accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT) {
                metadata.deposit_amount = parseFloat(rdDepositAmount);
                metadata.tenure_months = parseInt(rdTenure);
                metadata.interest_rate = parseFloat(rdInterestRate);
                metadata.start_date = rdStartDate;
                metadata.maturity_date = rdMaturityDate;
                metadata.maturity_amount = parseFloat(rdMaturityAmount);
                metadata.interest_accrual_day = rdStartDate ? parseInt(rdStartDate.split('-')[2], 10) : 1;
                metadata.deposit_day = parseInt(rdDepositDay);
                metadata.is_auto_deposit = rdIsAutoDeposit;
                metadata.linked_account_id = rdLinkedAccountId || null;"""
content = content.replace("            } else if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT) {", rd_metadata + "\n            } else if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT) {")

# 8. Render block
rd_render = """
                            {accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <Repeat className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <h4 className="text-sm font-bold text-foreground">Recurring Deposit Details</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Monthly Deposit</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={rdDepositAmount}
                                                    onChange={(e) => setRdDepositAmount(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tenure (Months)</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 12"
                                                value={rdTenure}
                                                onChange={(e) => setRdTenure(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Rate (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="e.g. 6.5"
                                                value={rdInterestRate}
                                                onChange={(e) => setRdInterestRate(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Deposit Day</label>
                                            <input
                                                type="number"
                                                min="1" max="31"
                                                placeholder="e.g. 5"
                                                value={rdDepositDay}
                                                onChange={(e) => setRdDepositDay(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={rdStartDate}
                                                onChange={(e) => setRdStartDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Date</label>
                                            <input
                                                type="date"
                                                value={rdMaturityDate}
                                                onChange={(e) => setRdMaturityDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Amount (Estimated)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={rdMaturityAmount}
                                                onChange={(e) => setRdMaturityAmount(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                                            <span className="text-sm font-medium text-foreground">Enable Auto Deposit</span>
                                            <Switch
                                                checked={rdIsAutoDeposit}
                                                onCheckedChange={setRdIsAutoDeposit}
                                            />
                                        </div>
                                        {rdIsAutoDeposit && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Linked Account (Source)</label>
                                                <Select
                                                    value={rdLinkedAccountId}
                                                    onValueChange={setRdLinkedAccountId}
                                                >
                                                    <SelectTrigger className="w-full h-12">
                                                        <SelectValue placeholder="Select account" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Available Accounts</SelectLabel>
                                                            {accounts.filter(a => a.account_type === 'SAVINGS' && a.currency === currency).map(acc => (
                                                                <SelectItem key={acc.account_id} value={acc.account_id}>
                                                                    {acc.account_name} ({currency} {acc.balance?.toLocaleString()})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}"""
content = content.replace("{accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (", rd_render + "\n\n                            {accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (")

# 9. Form validation
rd_validation = """ ||
                        (accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT && (!rdDepositAmount || !rdInterestRate || !rdTenure || !rdStartDate || (rdIsAutoDeposit && !rdLinkedAccountId)))"""
content = content.replace("(accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (!fdPrincipal || !fdInterestRate || !fdStartDate || !fdMaturityDate || !fdMaturityAmount))", 
"(accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (!fdPrincipal || !fdInterestRate || !fdStartDate || !fdMaturityDate || !fdMaturityAmount))" + rd_validation)

with open('frontend/src/components/account/common/CreateAccountForm.tsx', 'w') as f:
    f.write(content)

