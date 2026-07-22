import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:my_folio_manager/core/models/models.dart';
import 'package:my_folio_manager/features/shared/providers/categories_provider.dart';
import 'package:my_folio_manager/features/accounts/rules_provider.dart';
import 'package:my_folio_manager/features/accounts/accounts_provider.dart';
import 'package:my_folio_manager/features/shared/widgets/app_select_field.dart';

class RuleForm extends ConsumerStatefulWidget {
  final String accountId;
  final Rule? ruleToEdit;

  const RuleForm({
    super.key,
    required this.accountId,
    this.ruleToEdit,
  });

  @override
  ConsumerState<RuleForm> createState() => _RuleFormState();
}

class _RuleFormState extends ConsumerState<RuleForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _descriptionContainsController;
  late TextEditingController _amountController;
  late TextEditingController _formulaController;
  
  RuleType _ruleType = RuleType.categorization;
  Frequency _frequency = Frequency.monthly;
  TransactionType _txType = TransactionType.debit;
  int? _selectedCategoryId;
  String? _targetAccountId;
  DateTime _nextRunAt = DateTime.now();
  DateTime? _endDate;
  bool _isActive = true;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.ruleToEdit?.name ?? '');
    _descriptionContainsController = TextEditingController(
      text: widget.ruleToEdit?.descriptionContains ?? '',
    );
    _amountController = TextEditingController(
      text: widget.ruleToEdit?.transactionAmount?.toString() ?? '',
    );
    _formulaController = TextEditingController(
      text: widget.ruleToEdit?.formula ?? '',
    );
    _ruleType = widget.ruleToEdit?.ruleType ?? RuleType.categorization;
    _frequency = widget.ruleToEdit?.frequency ?? Frequency.monthly;
    _txType = widget.ruleToEdit?.transactionType ?? TransactionType.debit;
    _selectedCategoryId = widget.ruleToEdit?.categoryId;
    _targetAccountId = widget.ruleToEdit?.targetAccountId;
    _isActive = widget.ruleToEdit?.isActive ?? true;
    if (widget.ruleToEdit?.nextRunAt != null) {
      _nextRunAt = DateTime.parse(widget.ruleToEdit!.nextRunAt!).toUtc();
    }
    if (widget.ruleToEdit?.endDate != null) {
      _endDate = DateTime.parse(widget.ruleToEdit!.endDate!).toUtc();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionContainsController.dispose();
    _amountController.dispose();
    _formulaController.dispose();
    super.dispose();
  }

  void _insertIntoFormula(String variable) {
    final text = _formulaController.text;
    final selection = _formulaController.selection;
    final newText = text.replaceRange(
      selection.start < 0 ? text.length : selection.start,
      selection.end < 0 ? text.length : selection.end,
      variable,
    );
    _formulaController.text = newText;
    _formulaController.selection = TextSelection.fromPosition(
      TextPosition(offset: (selection.start < 0 ? text.length : selection.start) + variable.length),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    // Explicit Enum mapping to stay 100% consistent with backend expected strings
    const ruleTypeMap = { RuleType.categorization: 'CATEGORIZATION', RuleType.transaction: 'TRANSACTION', RuleType.calculation: 'CALCULATION' };
    const frequencyMap = { Frequency.daily: 'DAILY', Frequency.weekly: 'WEEKLY', Frequency.monthly: 'MONTHLY', Frequency.yearly: 'YEARLY', Frequency.oneTime: 'ONE_TIME' };
    const txTypeMap = { TransactionType.debit: 'DEBIT', TransactionType.credit: 'CREDIT', TransactionType.transfer: 'TRANSFER' };

    setState(() => _isLoading = true);
    try {
      final data = <String, dynamic>{
        'account_id': widget.accountId,
        'name': _nameController.text.trim(),
        'rule_type': ruleTypeMap[_ruleType],
        'is_active': _isActive,
      };

      // Helper to avoid sending keys with null values which can cause 422s
      void addIfNotNull(String key, dynamic value) {
        if (value != null) data[key] = value;
      }

      if (_ruleType == RuleType.categorization) {
        data['description_contains'] = _descriptionContainsController.text.trim();
        addIfNotNull('category_id', _selectedCategoryId);
      } else {
        data['frequency'] = frequencyMap[_frequency];
        data['next_run_at'] = DateTime.utc(_nextRunAt.year, _nextRunAt.month, _nextRunAt.day).toIso8601String();
        if (_endDate != null) {
          data['end_date'] = DateTime.utc(_endDate!.year, _endDate!.month, _endDate!.day).toIso8601String();
        }
        addIfNotNull('category_id', _selectedCategoryId);
        
        // Backend TransactionType enum only supports DEBIT and CREDIT. 
        // For transfers, we omit the transaction_type and send target_account_id instead.
        if (_txType != TransactionType.transfer) {
          data['transaction_type'] = txTypeMap[_txType];
        }

        if (_ruleType == RuleType.calculation) {
          data['formula'] = _formulaController.text.trim();
        } else {
          final amt = double.tryParse(_amountController.text);
          addIfNotNull('transaction_amount', amt);
        }

        if (_txType == TransactionType.transfer) {
          addIfNotNull('target_account_id', _targetAccountId);
        }
      }

      if (widget.ruleToEdit != null) {
        await ref
            .read(accountRulesProvider(widget.accountId).notifier)
            .updateRule(widget.ruleToEdit!.ruleId, data);
      } else {
        await ref
            .read(accountRulesProvider(widget.accountId).notifier)
            .createRule(data);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.ruleToEdit != null ? 'Rule configuration saved' : 'New rule established'),
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      String errorMessage = e.toString();
      // Use DioException type for safer access to response data
      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map && data.containsKey('detail')) {
          errorMessage = data['detail'].toString();
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save rule: $errorMessage'), 
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesListProvider);
    final accountsAsync = ref.watch(accountsListProvider);
    final cs = Theme.of(context).colorScheme;

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
                    widget.ruleToEdit != null ? 'Edit Rule' : 'New Rule',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Rule Type Toggle (Simplified)
              Container(
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    _RuleTypeTab(
                      label: 'Categorization',
                      isSelected: _ruleType == RuleType.categorization,
                      onTap: () => setState(() => _ruleType = RuleType.categorization),
                    ),
                    _RuleTypeTab(
                      label: 'Automation',
                      isSelected: _ruleType == RuleType.transaction,
                      onTap: () => setState(() => _ruleType = RuleType.transaction),
                    ),
                    _RuleTypeTab(
                      label: 'Formula',
                      isSelected: _ruleType == RuleType.calculation,
                      onTap: () => setState(() => _ruleType = RuleType.calculation),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Rule Identifier',
                  hintText: 'e.g., Monthly Rent',
                  border: OutlineInputBorder(),
                ),
                validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),

              if (_ruleType == RuleType.categorization) ...[
                TextFormField(
                  controller: _descriptionContainsController,
                  decoration: const InputDecoration(
                    labelText: 'If Description Contains',
                    hintText: 'e.g., NETFLIX',
                    border: OutlineInputBorder(),
                    helperText: 'Matched case-insensitively during ingestion',
                  ),
                  validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 16),
                categoriesAsync.when(
                  data: (categories) => AppSelectField<int>(
                    label: 'Target Category',
                    title: 'Select Category',
                    value: _selectedCategoryId,
                    prefixIcon: Icons.category_outlined,
                    items: categories.map((c) => c.categoryId).toList(),
                    itemLabel: (id) => categories.firstWhere((c) => c.categoryId == id).name,
                    onChanged: (val) => setState(() => _selectedCategoryId = val),
                    validator: (val) => val == null ? 'Selection required' : null,
                  ),
                  loading: () => const LinearProgressIndicator(),
                  error: (_, __) => const Text('Unable to load categories'),
                ),
              ] else ...[
                // Automation / Calculation
                Row(
                  children: [
                    Expanded(
                      child: AppSelectField<Frequency>(
                        label: 'Frequency',
                        title: 'Select Frequency',
                        value: _frequency,
                        prefixIcon: Icons.repeat_outlined,
                        items: Frequency.values,
                        itemLabel: (f) => f.name.toUpperCase().replaceAll('_', ' '),
                        onChanged: (val) { if (val != null) setState(() => _frequency = val); },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppSelectField<TransactionType>(
                        label: 'Direction',
                        title: 'Select Direction',
                        value: _txType,
                        prefixIcon: Icons.swap_horiz_outlined,
                        items: TransactionType.values,
                        itemLabel: (t) => t.name.toUpperCase(),
                        onChanged: (val) { if (val != null) setState(() => _txType = val); },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.calendar_today, size: 16),
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _nextRunAt.isBefore(DateTime.now()) && _nextRunAt.year > 2000 ? _nextRunAt : DateTime.now(),
                            firstDate: DateTime(2000),
                            lastDate: DateTime.now().add(const Duration(days: 3650)),
                          );
                          if (date != null) setState(() => _nextRunAt = DateTime.utc(date.year, date.month, date.day));
                        },
                        label: Text('Execution Day: ${DateFormat('dd-MMM-yyyy').format(_nextRunAt)}'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _ruleType == RuleType.calculation
                        ? TextFormField(
                            controller: _formulaController,
                            decoration: const InputDecoration(labelText: 'Calculation Formula', border: OutlineInputBorder(), hintText: 'balance*0.01'),
                            validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                          )
                        : TextFormField(
                            controller: _amountController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Fixed Amount', border: OutlineInputBorder(), hintText: '0.00'),
                            validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.timer_off_outlined, size: 16),
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _endDate ?? DateTime.now().add(const Duration(days: 365)),
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 3650)),
                          );
                          if (date != null) setState(() => _endDate = DateTime.utc(date.year, date.month, date.day));
                        },
                        label: Text(_endDate == null ? 'No Expiry Set' : 'Expiry: ${DateFormat('dd-MMM-yyyy').format(_endDate!)}'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    if (_endDate != null) ...[
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.clear_outlined),
                        onPressed: () => setState(() => _endDate = null),
                      ),
                    ],
                  ],
                ),

                if (_txType == TransactionType.transfer) ...[
                  const SizedBox(height: 16),
                  accountsAsync.when(
                    data: (accounts) => AppSelectField<String>(
                      label: 'To Account',
                      title: 'Select Destination',
                      value: _targetAccountId,
                      prefixIcon: Icons.forward_outlined,
                      items: accounts.where((a) => a.accountId != widget.accountId).map((a) => a.accountId).toList(),
                      itemLabel: (id) {
                        final acc = accounts.firstWhere((a) => a.accountId == id);
                        return acc.accountName ?? acc.accountId;
                      },
                      onChanged: (val) => setState(() => _targetAccountId = val),
                      validator: (val) => val == null ? 'Target account required' : null,
                    ),
                    loading: () => const LinearProgressIndicator(),
                    error: (_, __) => const Text('Unable to load accounts'),
                  ),
                ],

                const SizedBox(height: 16),
                categoriesAsync.when(
                  data: (categories) => AppSelectField<int?>(
                    label: 'Category (Optional)',
                    title: 'Select Category',
                    value: _selectedCategoryId,
                    prefixIcon: Icons.label_outline,
                    items: [null, ...categories.map((c) => c.categoryId)],
                    itemLabel: (id) => id == null ? 'N/A' : categories.firstWhere((c) => c.categoryId == id).name,
                    onChanged: (val) => setState(() => _selectedCategoryId = val),
                  ),
                  loading: () => const LinearProgressIndicator(),
                  error: (_, __) => const Text('Unable to load categories'),
                ),

                if (_ruleType == RuleType.calculation) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: cs.primaryContainer.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: cs.primary.withValues(alpha: 0.1)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('AVAILABLE VARIABLES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: cs.primary, letterSpacing: 1.1)),
                        const SizedBox(height: 8),
                        ref.watch(accountsListProvider).when(
                          data: (accounts) {
                            final acc = accounts.firstWhere((a) => a.accountId == widget.accountId);
                            final List<Map<String, String>> vars;
                            switch (acc.accountType) {
                              case AccountType.savings:
                                vars = [
                                  {'name': 'balance', 'desc': 'Current Account Balance'},
                                  {'name': 'interest_rate', 'desc': 'Annual Interest Rate (%)'},
                                  {'name': 'min_balance', 'desc': 'Minimum Balance Requirement'},
                                ];
                                break;
                              case AccountType.loan:
                                vars = [
                                  {'name': 'outstanding_amount', 'desc': 'Current Outstanding Balance'},
                                  {'name': 'loan_amount', 'desc': 'Original Loan Amount'},
                                  {'name': 'interest_rate', 'desc': 'Annual Interest Rate (%)'},
                                ];
                                break;
                              case AccountType.fixedDeposit:
                                vars = [
                                  {'name': 'principal_amount', 'desc': 'Principal Deposited Amount'},
                                  {'name': 'interest_rate', 'desc': 'Annual Interest Rate (%)'},
                                ];
                                break;
                              case AccountType.investment:
                                vars = [
                                  {'name': 'balance', 'desc': 'Current Cash Balance'},
                                ];
                                break;
                            }
                            return Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: vars.map((v) => _VariableBadge(
                                label: v['name']!,
                                desc: v['desc']!,
                                onTap: () => _insertIntoFormula(v['name']!),
                              )).toList(),
                            );
                          },
                          loading: () => const CircularProgressIndicator(),
                          error: (_, __) => const Text('Unable to load account context'),
                        ),
                      ],
                    ),
                  ),
                ],
              ],

              const SizedBox(height: 20),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('ENABLE RULE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.1)),
                value: _isActive,
                onChanged: (val) => setState(() => _isActive = val),
              ),

              const SizedBox(height: 24),
              FilledButton(
                onPressed: _isLoading ? null : _submit,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('SAVE CONFIGURATION'),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _RuleTypeTab extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _RuleTypeTab({required this.label, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? cs.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))] : null,
          ),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label.toUpperCase(),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
                color: isSelected ? cs.primary : cs.onSurfaceVariant,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _VariableBadge extends StatelessWidget {
  final String label;
  final String desc;
  final VoidCallback onTap;
  const _VariableBadge({required this.label, required this.desc, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        width: (MediaQuery.of(context).size.width - 64) / 2, // 2 columns
        decoration: BoxDecoration(
          color: cs.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: cs.outlineVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: cs.primary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              desc.toUpperCase(),
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.bold,
                color: cs.onSurfaceVariant.withValues(alpha: 0.6),
                letterSpacing: 0.5,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
