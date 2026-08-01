import { PageHeader } from '../components/ui/PageHeader';
import AllTransactions from './AllTransactions';

export default function Activity() {
    return (
        <div className="page-shell">
            <PageHeader
                eyebrow="Money movement"
                title="Activity"
                description="Review, search, and manage transactions across all of your accounts."
            />
            <AllTransactions embedded />
        </div>
    );
}
