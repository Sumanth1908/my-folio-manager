import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:my_folio_manager/core/models/models.dart';
import 'package:my_folio_manager/features/shared/providers/categories_provider.dart';
import 'package:my_folio_manager/features/accounts/transactions_provider.dart';
import 'package:my_folio_manager/features/transactions/transactions_screen.dart';
import 'package:my_folio_manager/features/accounts/accounts_provider.dart';
import 'package:my_folio_manager/features/shared/widgets/app_select_field.dart';

class TransactionForm extends ConsumerStatefulWidget {
  final String? accountId;
  final Transaction? transactionToEdit;

  const TransactionForm({
    super.key,
    this.accountId,
    this.transactionToEdit,
  });

  @override
  ConsumerState<TransactionForm> createState() => _TransactionFormState();
}

class _TransactionFormState extends ConsumerState<TransactionForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _amountController;
  late TextEditingController _descriptionController;
  late DateTime _selectedDate;
  TransactionType _type = TransactionType.debit;
  int? _selectedCategoryId;
  String? _selectedAccountId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _amountController = TextEditingController(
      text: widget.transactionToEdit?.amount.toString() ?? '',
    );
    _descriptionController = TextEditingController(
      text: widget.transactionToEdit?.description ?? '',
    );
    _selectedDate = widget.transactionToEdit != null
        ? DateTime.parse(widget.transactionToEdit!.transactionDate)
        : DateTime.now();
    _type = widget.transactionToEdit?.transactionType ?? TransactionType.debit;
    _selectedCategoryId = widget.transactionToEdit?.categoryId;
    _selectedAccountId = widget.accountId ?? widget.transactionToEdit?.accountId;
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedAccountId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select an account')));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final data = <String, dynamic>{
        'amount': double.parse(_amountController.text),
        'transaction_type': _type.name.toUpperCase(),
        'description': _descriptionController.text,
        'category_id': _selectedCategoryId,
        'transaction_date': _selectedDate.toIso8601String(),
      };

      if (widget.transactionToEdit == null) {
        data['account_id'] = _selectedAccountId;
        data['currency'] = 'INR'; // TODO: Use account currency
      }

      if (widget.transactionToEdit != null) {
        await ref
            .read(accountTransactionsProvider(_selectedAccountId!).notifier)
            .updateTransaction(widget.transactionToEdit!.transactionId, data);
      } else {
        await ref
            .read(accountTransactionsProvider(_selectedAccountId!).notifier)
            .createTransaction(data);
      }
      
      // Invalidate the global transactions list so the feed updates
      ref.invalidate(transactionsProvider);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Transaction saved successfully'), behavior: SnackBarBehavior.floating),
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
    final categoriesAsync = ref.watch(categoriesListProvider);

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
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.transactionToEdit != null ? 'Edit Transaction' : 'New Transaction',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              if (widget.accountId == null) const SizedBox(height: 20),
              if (widget.accountId == null)
                ref.watch(accountsListProvider).when(
                  data: (accounts) => AppSelectField<String>(
                    label: 'Account',
                    title: 'Select Account',
                    value: _selectedAccountId,
                    prefixIcon: Icons.account_balance,
                    items: accounts.map((a) => a.accountId).toList(),
                    itemLabel: (id) => accounts.firstWhere((a) => a.accountId == id).accountName ?? 'Untitled Account',
                    onChanged: (val) => setState(() => _selectedAccountId = val),
                    validator: (val) => val == null ? 'Required' : null,
                  ),
                  loading: () => const LinearProgressIndicator(),
                  error: (_, __) => const Text('Failed to load accounts'),
                ),
              const SizedBox(height: 20),
              SegmentedButton<TransactionType>(
                segments: const [
                  ButtonSegment(value: TransactionType.debit, label: Text('Expense'), icon: Icon(Icons.remove_circle_outline)),
                  ButtonSegment(value: TransactionType.credit, label: Text('Income'), icon: Icon(Icons.add_circle_outline)),
                ],
                selected: {_type},
                onSelectionChanged: (set) => setState(() => _type = set.first),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Amount',
                  prefixIcon: Icon(Icons.attach_money),
                ),
                validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  prefixIcon: Icon(Icons.description_outlined),
                ),
              ),
              const SizedBox(height: 16),
              categoriesAsync.when(
                data: (categories) => AppSelectField<int?>(
                  label: 'Category',
                  title: 'Select Category',
                  value: _selectedCategoryId,
                  prefixIcon: Icons.category_outlined,
                  items: [null, ...categories.map((c) => c.categoryId)],
                  itemLabel: (id) => id == null ? 'No Category' : categories.firstWhere((c) => c.categoryId == id).name,
                  onChanged: (val) => setState(() => _selectedCategoryId = val),
                ),
                loading: () => const LinearProgressIndicator(),
                error: (_, __) => const Text('Failed to load categories'),
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: () {
                  showCupertinoModalPopup<void>(
                    context: context,
                    builder: (BuildContext context) => Container(
                      height: 280,
                      padding: const EdgeInsets.only(top: 6.0),
                      margin: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
                      color: CupertinoColors.systemBackground.resolveFrom(context),
                      child: SafeArea(
                        top: false,
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                CupertinoButton(
                                  child: const Text('Done'),
                                  onPressed: () => Navigator.of(context).pop(),
                                ),
                              ],
                            ),
                            Expanded(
                              child: CupertinoDatePicker(
                                initialDateTime: _selectedDate,
                                mode: CupertinoDatePickerMode.date,
                                use24hFormat: true,
                                onDateTimeChanged: (DateTime newDate) {
                                  setState(() => _selectedDate = newDate);
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date',
                    prefixIcon: Icon(Icons.calendar_today_outlined),
                  ),
                  child: Text(DateFormat('yyyy-MM-dd').format(_selectedDate)),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save Transaction'),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
