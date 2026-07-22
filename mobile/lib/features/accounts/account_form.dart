import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/models/models.dart';
import 'accounts_provider.dart';
import '../shared/widgets/app_select_field.dart';

class AccountForm extends ConsumerStatefulWidget {
  final Account? accountToEdit;

  const AccountForm({super.key, this.accountToEdit});

  @override
  ConsumerState<AccountForm> createState() => _AccountFormState();
}

class _AccountFormState extends ConsumerState<AccountForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _currencyController;
  late TextEditingController _balanceController;
  late TextEditingController _interestRateController;
  late TextEditingController _minBalanceController;
  late TextEditingController _emiController;
  late TextEditingController _tenureController;
  late TextEditingController _outstandingController;
  late TextEditingController _maturityAmountController;
  
  AccountType _type = AccountType.savings;
  bool _isLoading = false;
  DateTime _startDate = DateTime.now();
  DateTime _maturityDate = DateTime.now().add(const Duration(days: 365));

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.accountToEdit?.accountName ?? '');
    _currencyController = TextEditingController(text: widget.accountToEdit?.currency ?? 'INR');
    
    _balanceController = TextEditingController();
    _interestRateController = TextEditingController();
    _minBalanceController = TextEditingController();
    _emiController = TextEditingController();
    _tenureController = TextEditingController();
    _outstandingController = TextEditingController();
    _maturityAmountController = TextEditingController();

    if (widget.accountToEdit != null) {
      _type = widget.accountToEdit!.accountType;
      switch (_type) {
        case AccountType.savings:
          _balanceController.text = widget.accountToEdit!.savingsAccount?.balance.toString() ?? '';
          _interestRateController.text = widget.accountToEdit!.savingsAccount?.interestRate?.toString() ?? '';
          _minBalanceController.text = widget.accountToEdit!.savingsAccount?.minBalance?.toString() ?? '';
          break;
        case AccountType.loan:
          _balanceController.text = widget.accountToEdit!.loanAccount?.loanAmount.toString() ?? '';
          _outstandingController.text = widget.accountToEdit!.loanAccount?.outstandingAmount.toString() ?? '';
          _interestRateController.text = widget.accountToEdit!.loanAccount?.interestRate.toString() ?? '';
          _tenureController.text = widget.accountToEdit!.loanAccount?.tenureMonths.toString() ?? '';
          _emiController.text = widget.accountToEdit!.loanAccount?.emiAmount.toString() ?? '';
          _startDate = DateTime.parse(widget.accountToEdit!.loanAccount!.startDate);
          break;
        case AccountType.fixedDeposit:
          _balanceController.text = widget.accountToEdit!.fixedDepositAccount?.principalAmount.toString() ?? '';
          _interestRateController.text = widget.accountToEdit!.fixedDepositAccount?.interestRate.toString() ?? '';
          _maturityAmountController.text = widget.accountToEdit!.fixedDepositAccount?.maturityAmount.toString() ?? '';
          _startDate = DateTime.parse(widget.accountToEdit!.fixedDepositAccount!.startDate);
          _maturityDate = DateTime.parse(widget.accountToEdit!.fixedDepositAccount!.maturityDate);
          break;
        case AccountType.investment:
          break;
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _currencyController.dispose();
    _balanceController.dispose();
    _interestRateController.dispose();
    _minBalanceController.dispose();
    _emiController.dispose();
    _tenureController.dispose();
    _outstandingController.dispose();
    _maturityAmountController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      const accountTypeMap = {
        AccountType.savings: 'SAVINGS',
        AccountType.investment: 'INVESTMENT',
        AccountType.fixedDeposit: 'FIXED_DEPOSIT',
        AccountType.loan: 'LOAN',
      };

      final data = <String, dynamic>{
        'account_name': _nameController.text,
        'account_type': accountTypeMap[_type],
        'currency': _currencyController.text,
        'status': 'ACTIVE',
        'is_interest_enabled': true,
      };

      if (_type == AccountType.savings) {
        data['savings_account'] = {
          'balance': double.parse(_balanceController.text),
          'interest_rate': double.tryParse(_interestRateController.text),
          'min_balance': double.tryParse(_minBalanceController.text),
        };
      } else if (_type == AccountType.loan) {
        data['loan_account'] = {
          'loan_amount': double.parse(_balanceController.text),
          'outstanding_amount': double.parse(_outstandingController.text.isNotEmpty ? _outstandingController.text : _balanceController.text),
          'interest_rate': double.parse(_interestRateController.text),
          'tenure_months': int.parse(_tenureController.text),
          'emi_amount': double.parse(_emiController.text),
          'start_date': _startDate.toIso8601String(),
        };
      } else if (_type == AccountType.fixedDeposit) {
        data['fixed_deposit_account'] = {
          'principal_amount': double.parse(_balanceController.text),
          'interest_rate': double.parse(_interestRateController.text),
          'start_date': _startDate.toIso8601String(),
          'maturity_date': _maturityDate.toIso8601String(),
          'maturity_amount': double.parse(_maturityAmountController.text),
        };
      }

      if (widget.accountToEdit != null) {
        await ref
            .read(accountDetailProvider(widget.accountToEdit!.accountId).notifier)
            .updateAccount(widget.accountToEdit!.accountId, data);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Account updated successfully')),
          );
        }
      } else {
        await ref.read(accountDetailProvider('').notifier).createAccount(data);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Account created successfully')),
          );
        }
      }

      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Account?'),
        content: const Text(
            'This will permanently delete this account and all associated transactions. This action cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);
    try {
      await ref
          .read(accountDetailProvider(widget.accountToEdit!.accountId).notifier)
          .deleteAccount(widget.accountToEdit!.accountId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account deleted successfully')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 20,
        right: 20,
        top: 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Text(
                    widget.accountToEdit != null ? 'Edit Account' : 'New Account',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  if (widget.accountToEdit != null)
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: Colors.red),
                      onPressed: _isLoading ? null : _delete,
                      tooltip: 'Delete Account',
                    ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              AppSelectField<AccountType>(
                label: 'Account Type',
                title: 'Select Account Type',
                value: _type,
                prefixIcon: Icons.account_tree_outlined,
                items: AccountType.values,
                itemLabel: (t) => t.name.toUpperCase(),
                onChanged: widget.accountToEdit != null ? null : (val) {
                  if (val != null) setState(() => _type = val);
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Account Name', border: OutlineInputBorder()),
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _currencyController,
                      decoration: const InputDecoration(labelText: 'Currency', border: OutlineInputBorder()),
                      validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _balanceController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: _type == AccountType.savings ? 'Balance' : (_type == AccountType.loan ? 'Amount' : 'Principal'),
                        border: const OutlineInputBorder(),
                      ),
                      validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              if (_type == AccountType.savings) ...[
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _interestRateController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Interest Rate %', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _minBalanceController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Min Balance', border: OutlineInputBorder()),
                      ),
                    ),
                  ],
                ),
              ],

              if (_type == AccountType.loan) ...[
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _outstandingController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Outstanding', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _interestRateController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Interest Rate %', border: OutlineInputBorder()),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _emiController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'EMI Amount', border: OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _tenureController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Tenure (Months)', border: OutlineInputBorder()),
                      ),
                    ),
                  ],
                ),
              ],

              if (_type == AccountType.fixedDeposit) ...[
                TextFormField(
                  controller: _interestRateController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Interest Rate %', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _maturityAmountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Maturity Amount', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _startDate,
                            firstDate: DateTime(2000),
                            lastDate: DateTime(2100),
                          );
                          if (date != null) setState(() => _startDate = date);
                        },
                        child: Text('Start: ${DateFormat('yyyy-MM-dd').format(_startDate)}'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _maturityDate,
                            firstDate: DateTime(2000),
                            lastDate: DateTime(2100),
                          );
                          if (date != null) setState(() => _maturityDate = date);
                        },
                        child: Text('Maturity: ${DateFormat('yyyy-MM-dd').format(_maturityDate)}'),
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 24),
              FilledButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(widget.accountToEdit != null ? 'Update Account' : 'Create Account'),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
