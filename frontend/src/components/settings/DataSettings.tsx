import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Download, Upload, AlertTriangle, CheckCircle, Database, HardDrive, FileJson } from 'lucide-react';
import api, { handleApiError } from '../../api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import ConfirmModal from '../common/ConfirmModal';

interface ImportSummary {
    categories: number;
    accounts: number;
    savings_accounts: number;
    loan_accounts: number;
    fixed_deposit_accounts: number;
    investment_holdings: number;
    transactions: number;
    rules: number;
}

export function DataSettings() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [clearExisting, setClearExisting] = useState(false);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/data/export');
            const data = response.data;

            // Create and download the JSON file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            link.download = `my-folio-backup-${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Data exported successfully!');
        } catch (err) {
            toast.error(handleApiError(err, 'Failed to export data'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.name.endsWith('.json')) {
                toast.error('Please select a valid JSON file');
                return;
            }
            setSelectedFile(file);
            setShowImportConfirm(true);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setIsImporting(true);
        setShowImportConfirm(false);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post(`/data/import?clear_existing=${clearExisting}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setImportSummary(response.data.summary);
            toast.success('Data imported successfully!');
        } catch (err) {
            toast.error(handleApiError(err, 'Failed to import data'));
        } finally {
            setIsImporting(false);
            setSelectedFile(null);
            setClearExisting(false);
        }
    };

    const cancelImport = () => {
        setShowImportConfirm(false);
        setSelectedFile(null);
        setClearExisting(false);
    };

    return (
        <>
            <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-8">
                <div>
                    <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Data Management</h2>
                    <p className="text-sm text-muted-foreground mt-1">Export your data for backup or import from a previous snapshot.</p>
                </div>

                {/* Export Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Download className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Export Data</h3>
                            <p className="text-xs text-muted-foreground">Download all your financial data as a JSON file</p>
                        </div>
                    </div>

                    <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                <span>Accounts</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <HardDrive className="w-4 h-4" />
                                <span>Transactions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FileJson className="w-4 h-4" />
                                <span>Categories, Rules & Settings</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleExport}
                        isLoading={isExporting}
                        className="w-full sm:w-auto shadow-lg shadow-primary/20"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exporting...' : 'Export All Data'}
                    </Button>
                </div>

                {/* Divider */}
                <div className="border-t border-border/50" />

                {/* Import Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Import Data</h3>
                            <p className="text-xs text-muted-foreground">Restore your data from a previously exported backup</p>
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-amber-200/80 space-y-1">
                                <p className="font-semibold">Important Notes:</p>
                                <ul className="list-disc pl-4 space-y-1 text-amber-200/60">
                                    <li>Imported data will be added alongside your existing data unless you choose to clear existing data first.</li>
                                    <li>IDs will be regenerated to avoid conflicts, so references between items will be preserved within the import.</li>
                                    <li>Make sure to export your current data before importing if you want to keep a backup.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <div>
                                <p className="text-sm font-bold text-foreground">Clear existing data before import</p>
                                <p className="text-xs text-muted-foreground">This will delete all your current data before importing</p>
                            </div>
                        </div>
                        <Switch
                            checked={clearExisting}
                            onCheckedChange={setClearExisting}
                        />
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="import-file"
                    />

                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={isImporting}
                        className="w-full sm:w-auto"
                    >
                        <Upload className="w-4 h-4" />
                        {isImporting ? 'Importing...' : 'Select File to Import'}
                    </Button>
                </div>

                {/* Import Summary */}
                {importSummary && (
                    <div className="border-t border-border/50 pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h3 className="text-lg font-bold text-foreground">Import Complete</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Object.entries(importSummary).map(([key, value]) => (
                                <div key={key} className="bg-muted/20 rounded-xl p-3 border border-border/50">
                                    <p className="text-2xl font-black text-primary">{value}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                        {key.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Import Confirmation Modal */}
            <ConfirmModal
                isOpen={showImportConfirm}
                onClose={cancelImport}
                title={clearExisting ? "Clear & Import Data" : "Import Data"}
                message={
                    clearExisting
                        ? `Are you sure you want to clear all existing data and import from "${selectedFile?.name}"? This action cannot be undone.`
                        : `Are you sure you want to import data from "${selectedFile?.name}"? The imported data will be added alongside your existing data.`
                }
                variant={clearExisting ? "danger" : "primary"}
                onConfirm={handleImport}
            />
        </>
    );
}
