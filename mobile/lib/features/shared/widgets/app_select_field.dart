import 'package:flutter/material.dart';

class SelectionBottomSheet<T> extends StatelessWidget {
  final String title;
  final List<T> items;
  final T? selectedValue;
  final String Function(T) itemLabel;
  final Widget Function(T)? itemIcon;
  final String Function(T)? itemSubtitle;

  const SelectionBottomSheet({
    super.key,
    required this.title,
    required this.items,
    this.selectedValue,
    required this.itemLabel,
    this.itemIcon,
    this.itemSubtitle,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.only(top: 12, bottom: 32),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: cs.outlineVariant.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton.filledTonal(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.6,
            ),
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: items.length,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              separatorBuilder: (_, __) => const SizedBox(height: 4),
              itemBuilder: (context, index) {
                final item = items[index];
                final isSelected = item == selectedValue;

                return InkWell(
                  onTap: () => Navigator.pop(context, item),
                  borderRadius: BorderRadius.circular(16),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected ? cs.primaryContainer.withValues(alpha: 0.4) : Colors.transparent,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? cs.primary.withValues(alpha: 0.2) : Colors.transparent,
                      ),
                    ),
                    child: Row(
                      children: [
                        if (itemIcon != null) ...[
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isSelected ? cs.primary.withValues(alpha: 0.1) : cs.surfaceContainerHigh,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: IconTheme(
                              data: IconThemeData(color: isSelected ? cs.primary : cs.onSurfaceVariant, size: 20),
                              child: itemIcon!(item),
                            ),
                          ),
                          const SizedBox(width: 16),
                        ],
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                itemLabel(item),
                                style: TextStyle(
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  color: isSelected ? cs.primary : cs.onSurface,
                                  fontSize: 16,
                                ),
                              ),
                              if (itemSubtitle != null)
                                Text(
                                  itemSubtitle!(item),
                                  style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12),
                                ),
                            ],
                          ),
                        ),
                        if (isSelected)
                          Icon(Icons.check_circle, color: cs.primary, size: 24),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class AppSelectField<T> extends StatelessWidget {
  final String label;
  final String? hint;
  final T? value;
  final String Function(T) itemLabel;
  final Widget Function(T)? itemIcon;
  final String title;
  final List<T> items;
  final ValueChanged<T?>? onChanged;
  final String? Function(T?)? validator;
  final IconData? prefixIcon;

  const AppSelectField({
    super.key,
    required this.label,
    this.hint,
    this.value,
    required this.itemLabel,
    this.itemIcon,
    required this.title,
    required this.items,
    this.onChanged,
    this.validator,
    this.prefixIcon,
  });

  @override
  Widget build(BuildContext context) {
    final bool isEnabled = onChanged != null;
    final cs = Theme.of(context).colorScheme;

    return FormField<T>(
      initialValue: value,
      validator: validator,
      builder: (state) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            InkWell(
              onTap: !isEnabled ? null : () async {
                final result = await showModalBottomSheet<T>(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (context) => SelectionBottomSheet<T>(
                    title: title,
                    items: items,
                    selectedValue: state.value,
                    itemLabel: itemLabel,
                    itemIcon: itemIcon,
                  ),
                );
                if (result != null) {
                  state.didChange(result);
                  onChanged?.call(result);
                }
              },
              borderRadius: BorderRadius.circular(12),
              child: Opacity(
                opacity: isEnabled ? 1.0 : 0.6,
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: label,
                    hintText: hint,
                    errorText: state.errorText,
                    prefixIcon: prefixIcon != null ? Icon(prefixIcon) : null,
                    suffixIcon: isEnabled ? const Icon(Icons.keyboard_arrow_down_rounded) : null,
                    fillColor: !isEnabled ? cs.surfaceContainerHigh : null,
                    filled: !isEnabled,
                  ),
                  child: Text(
                    state.value != null ? itemLabel(state.value as T) : (hint ?? ''),
                    style: TextStyle(
                      color: state.value != null ? null : cs.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
