export type LoanCalculationSource = 'TENURE' | 'EMI';

const positiveNumber = (value: string | number): number | null => {
    if (String(value).trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const nonNegativeNumber = (value: string | number): number | null => {
    if (String(value).trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const calculateLoanEmi = (
    principalInput: string | number,
    annualRateInput: string | number,
    tenureMonthsInput: string | number,
): number | null => {
    const principal = positiveNumber(principalInput);
    const tenureMonths = positiveNumber(tenureMonthsInput);
    const annualRate = nonNegativeNumber(annualRateInput);
    if (!principal || !tenureMonths || annualRate == null) return null;

    const monthlyRate = annualRate / 1200;
    if (monthlyRate === 0) return principal / tenureMonths;
    const growth = Math.pow(1 + monthlyRate, tenureMonths);
    return principal * monthlyRate * growth / (growth - 1);
};

export const calculateLoanTenure = (
    principalInput: string | number,
    annualRateInput: string | number,
    emiInput: string | number,
): number | null => {
    const principal = positiveNumber(principalInput);
    const emi = positiveNumber(emiInput);
    const annualRate = nonNegativeNumber(annualRateInput);
    if (!principal || !emi || annualRate == null) return null;

    const monthlyRate = annualRate / 1200;
    if (monthlyRate === 0) return Math.ceil(principal / emi);
    if (emi <= principal * monthlyRate) return null;

    const exactMonths = Math.log(emi / (emi - principal * monthlyRate)) / Math.log(1 + monthlyRate);
    return Number.isFinite(exactMonths) ? Math.ceil(exactMonths) : null;
};

export const addMonthsClamped = (isoDate: string, monthsInput: string | number): string => {
    const months = Number.parseInt(String(monthsInput), 10);
    const [year, month, day] = isoDate.split('-').map(Number);
    if (!year || !month || !day || !Number.isInteger(months) || months < 0) return '';

    const targetMonthIndex = month - 1 + months;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    const targetDay = Math.min(day, lastDay);
    return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
};

export interface LoanProjection {
    totalInterest: number;
    totalPayable: number;
    finalPayment: number;
}

export const calculateLoanProjection = (
    principalInput: string | number,
    annualRateInput: string | number,
    emiInput: string | number,
    tenureMonthsInput: string | number,
): LoanProjection | null => {
    const principal = positiveNumber(principalInput);
    const emi = positiveNumber(emiInput);
    const tenureMonths = positiveNumber(tenureMonthsInput);
    const annualRate = nonNegativeNumber(annualRateInput);
    if (!principal || !emi || !tenureMonths || annualRate == null) return null;

    const monthlyRate = annualRate / 1200;
    let balance = principal;
    let totalPayable = 0;
    let finalPayment = 0;
    const paymentMonths = Math.ceil(tenureMonths);
    for (let month = 0; month < paymentMonths && balance > 0.005; month += 1) {
        const amountDue = balance * (1 + monthlyRate);
        // Currency rounding can leave a few cents after an otherwise correct
        // calculated EMI. Fold that residual into the last scheduled payment.
        const payment = month === paymentMonths - 1
            ? amountDue
            : Math.min(emi, amountDue);
        if (payment <= balance * monthlyRate) return null;
        balance = Math.max(0, amountDue - payment);
        totalPayable += payment;
        finalPayment = payment;
    }

    return {
        totalInterest: Math.max(0, totalPayable - principal),
        totalPayable,
        finalPayment,
    };
};
