import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/utils/money_format.dart';
import 'package:my_folio_manager/core/api/api_client.dart';
import 'package:my_folio_manager/core/api/api_endpoints.dart';
import 'package:my_folio_manager/core/models/models.dart';
import 'package:my_folio_manager/features/accounts/accounts_provider.dart';

enum HoldingAction { buy, sell, edit }

class HoldingForm extends ConsumerStatefulWidget {
  final String accountId;
  final String currency;
  final InvestmentHolding? holdingToEdit;
  final HoldingAction initialAction;

  const HoldingForm({
    super.key,
    required this.accountId,
    required this.currency,
    this.holdingToEdit,
    this.initialAction = HoldingAction.buy,
  });

  @override
  ConsumerState<HoldingForm> createState() => _HoldingFormState();
}

class _HoldingFormState extends ConsumerState<HoldingForm> {
  final _formKey = GlobalKey<FormState>();
  late HoldingAction _action;
  late TextEditingController _symbolController;
  late TextEditingController _nameController;
  late TextEditingController _quantityController;
  late TextEditingController _priceController;
  
  bool _isLoading = false;
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _action = widget.initialAction;
    _symbolController = TextEditingController(text: widget.holdingToEdit?.symbol ?? '');
    _nameController = TextEditingController(text: widget.holdingToEdit?.name ?? '');
    _quantityController = TextEditingController(
      text: _action == HoldingAction.edit ? widget.holdingToEdit?.quantity.toString() : '',
    );
    _priceController = TextEditingController(
      text: _action == HoldingAction.edit 
          ? widget.holdingToEdit?.averagePrice.toString() 
          : (widget.holdingToEdit?.currentPrice ?? widget.holdingToEdit?.averagePrice ?? '').toString(),
    );
    
    _symbolController.addListener(_onSymbolChanged);
  }

  @override
  void dispose() {
    _symbolController.removeListener(_onSymbolChanged);
    _symbolController.dispose();
    _nameController.dispose();
    _quantityController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  void _onSymbolChanged() {
    if (_action == HoldingAction.edit || _action == HoldingAction.sell) return;
    final query = _symbolController.text;
    if (query.length < 1) {
      setState(() => _searchResults = []);
      return;
    }
    _searchSymbols(query);
  }

  Future<void> _searchSymbols(String query) async {
    setState(() => _isSearching = true);
    try {
      final response = await ApiClient.instance.dio.get(
        '${ApiEndpoints.holdings}search-symbols',
        queryParameters: {'q': query, 'currency': widget.currency},
      );
      if (mounted) {
        setState(() {
          _searchResults = (response.data as List).cast<Map<String, dynamic>>();
          _isSearching = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isSearching = false);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final qty = double.parse(_quantityController.text);
      final price = double.parse(_priceController.text);

      if (_action == HoldingAction.buy) {
        await ref.read(holdingsNotifierProvider(widget.accountId).notifier).buyHolding({
          'account_id': widget.accountId,
          'symbol': _symbolController.text.toUpperCase(),
          'name': _nameController.text,
          'quantity': qty,
          'average_price': price,
          'currency': widget.currency,
        });
      } else if (_action == HoldingAction.sell) {
        if (widget.holdingToEdit == null) return;
        await ref.read(holdingsNotifierProvider(widget.accountId).notifier).sellHolding(
          widget.holdingToEdit!.holdingId,
          {
            'quantity': qty,
            'price': price,
          },
        );
      } else if (_action == HoldingAction.edit) {
        if (widget.holdingToEdit == null) return;
        await ref.read(holdingsNotifierProvider(widget.accountId).notifier).updateHolding(
          widget.holdingToEdit!.holdingId,
          {
            'symbol': _symbolController.text.toUpperCase(),
            'name': _nameController.text,
            'quantity': qty,
            'average_price': price,
            'account_id': widget.accountId,
            'currency': widget.currency,
          },
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${_action.name.toUpperCase()} operation successful'), behavior: SnackBarBehavior.floating),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final fmt = MoneyFormat(symbol: '${widget.currency} ', currency: widget.currency);
    
    double? totalValue;
    final q = double.tryParse(_quantityController.text);
    final p = double.tryParse(_priceController.text);
    if (q != null && p != null) totalValue = q * p;

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
                    _action == HoldingAction.buy ? 'Confirm Purchase' : (_action == HoldingAction.sell ? 'Confirm Sale' : 'Edit Holding'),
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (widget.holdingToEdit != null && _action != HoldingAction.edit)
                SegmentedButton<HoldingAction>(
                  segments: const [
                    ButtonSegment(value: HoldingAction.buy, label: Text('Buy More'), icon: Icon(Icons.add_shopping_cart)),
                    ButtonSegment(value: HoldingAction.sell, label: Text('Sell'), icon: Icon(Icons.sell_outlined)),
                  ],
                  selected: {_action},
                  onSelectionChanged: (set) {
                    setState(() {
                      _action = set.first;
                      if (_action == HoldingAction.sell) {
                        _quantityController.text = widget.holdingToEdit!.quantity.toString();
                        _priceController.text = (widget.holdingToEdit!.currentPrice ?? widget.holdingToEdit!.averagePrice).toString();
                      } else {
                        _quantityController.text = '';
                        _priceController.text = (widget.holdingToEdit!.currentPrice ?? widget.holdingToEdit!.averagePrice).toString();
                      }
                    });
                  },
                )
              else if (widget.holdingToEdit == null)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Icon(Icons.info_outline, size: 16),
                        SizedBox(width: 8),
                        Text('Buying new asset for this portfolio', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              
              const SizedBox(height: 20),
              
              // Symbol & Name (Disabled if selling or editing an existing holding unless it's a generic edit)
              TextFormField(
                controller: _symbolController,
                enabled: widget.holdingToEdit == null || _action == HoldingAction.edit,
                decoration: InputDecoration(
                  labelText: 'Stock Symbol',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _isSearching ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))) : null,
                  border: const OutlineInputBorder(),
                ),
                textCapitalization: TextCapitalization.characters,
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              
              if (_searchResults.isNotEmpty && (widget.holdingToEdit == null))
                Container(
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  constraints: const BoxConstraints(maxHeight: 200),
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: _searchResults.length,
                    itemBuilder: (context, index) {
                      final item = _searchResults[index];
                      return ListTile(
                        dense: true,
                        title: Text(item['symbol'], style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(item['name']),
                        trailing: Text(item['stock_exchange'] ?? ''),
                        onTap: () {
                          setState(() {
                            _symbolController.text = item['symbol'];
                            _nameController.text = item['name'];
                            _searchResults = [];
                          });
                        },
                      );
                    },
                  ),
                ),
              
              const SizedBox(height: 16),
              TextFormField(
                controller: _nameController,
                enabled: widget.holdingToEdit == null || _action == HoldingAction.edit,
                decoration: const InputDecoration(labelText: 'Company/Asset Name', border: OutlineInputBorder()),
                validator: (val) => val == null || val.isEmpty ? 'Required' : null,
              ),
              
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _quantityController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: _action == HoldingAction.sell ? 'Qty to Sell' : 'Quantity',
                        border: const OutlineInputBorder(),
                        helperText: _action == HoldingAction.sell ? 'Available: ${widget.holdingToEdit?.quantity}' : null,
                      ),
                      onChanged: (_) => setState(() {}),
                      validator: (val) {
                        if (val == null || val.isEmpty) return 'Required';
                        final d = double.tryParse(val);
                        if (d == null) return 'Invalid number';
                        if (_action == HoldingAction.sell && widget.holdingToEdit != null) {
                          if (d > widget.holdingToEdit!.quantity) return 'Max: ${widget.holdingToEdit!.quantity}';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _priceController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: _action == HoldingAction.sell ? 'Sell Price' : 'Buy Price',
                        border: const OutlineInputBorder(),
                      ),
                      onChanged: (_) => setState(() {}),
                      validator: (val) => (val == null || val.isEmpty) ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              if (totalValue != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _action == HoldingAction.sell ? cs.errorContainer : cs.primaryContainer,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _action == HoldingAction.sell ? 'EXPECTED PROCEEDS' : 'TOTAL INVESTMENT',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: _action == HoldingAction.sell ? cs.onErrorContainer : cs.onPrimaryContainer,
                        ),
                      ),
                      Text(
                        fmt.format(totalValue),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: _action == HoldingAction.sell ? cs.onErrorContainer : cs.onPrimaryContainer,
                        ),
                      ),
                    ],
                  ),
                ),
              
              const SizedBox(height: 32),
              FilledButton(
                onPressed: _isLoading ? null : _submit,
                style: FilledButton.styleFrom(
                  backgroundColor: _action == HoldingAction.sell ? cs.error : cs.primary,
                  minimumSize: const Size.fromHeight(56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(
                        _action == HoldingAction.buy ? 'CONFIRM PURCHASE' : (_action == HoldingAction.sell ? 'CONFIRM SALE' : 'SAVE CHANGES'),
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
