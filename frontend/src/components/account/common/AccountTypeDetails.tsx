import InvestmentDetails from '../investment/InvestmentDetails';
import SavingsDetails from '../savings/SavingsDetails';
import LoanDetails from '../loan/LoanDetails';
import FDDetails from '../fixed-deposit/FDDetails';
import type { Account } from '../../../types';
import { ACCOUNT_TYPE } from '../../../constants';

interface AccountTypeDetailsProps {
    account: Account;
    symbol: string;
}

const AccountTypeDetails = ({ account, symbol }: AccountTypeDetailsProps) => {
    if (account.account_type === ACCOUNT_TYPE.SAVINGS) {
        return <SavingsDetails account={account} symbol={symbol} />;
    }

    if (account.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT) {
        return <FDDetails account={account} symbol={symbol} />;
    }

    if (account.account_type === ACCOUNT_TYPE.LOAN) {
        return <LoanDetails account={account} symbol={symbol} />;
    }

    if (account.account_type === ACCOUNT_TYPE.INVESTMENT) {
        return <InvestmentDetails account={account} symbol={symbol} />;
    }

    return null;
}

export default AccountTypeDetails;
