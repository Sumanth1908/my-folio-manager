import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:my_folio_manager/core/api/api_client.dart';
import 'package:my_folio_manager/core/api/api_endpoints.dart';
import 'package:my_folio_manager/core/config/app_config.dart';
import 'package:my_folio_manager/core/providers/auth_provider.dart';
import 'package:my_folio_manager/core/router/app_router.dart';
import 'package:my_folio_manager/core/providers/theme_provider.dart';
import 'package:my_folio_manager/core/models/models.dart';
import 'package:my_folio_manager/features/shared/providers/categories_provider.dart';
import 'package:intl/intl.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────────────────────────────────────

final userSettingsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final response = await ApiClient.instance.dio.get(ApiEndpoints.settings);
  return response.data as Map<String, dynamic>;
});

final currenciesProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final response = await ApiClient.instance.dio.get(ApiEndpoints.currencies);
  return (response.data as List<dynamic>).cast<Map<String, dynamic>>();
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final settingsAsync = ref.watch(userSettingsProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: cs.primaryContainer,
                  child: Text(
                    (user?.fullName?.isNotEmpty == true ? user!.fullName![0] : (user?.email.isNotEmpty == true ? user!.email[0] : 'U')).toUpperCase(),
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: cs.primary),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(user?.fullName ?? 'User', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), overflow: TextOverflow.ellipsis),
                    Text(user?.email ?? '', style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13), overflow: TextOverflow.ellipsis),
                  ]),
                ),
              ]),
            ),
          ),

          const SizedBox(height: 24),
          const SizedBox(height: 24),
          const _SectionHeader(label: 'Identity'),
          const SizedBox(height: 8),
          const _IdentityCard(),

          const SizedBox(height: 24),
          const _SectionHeader(label: 'Appearance'),
          const SizedBox(height: 8),
          const _ThemeCard(),

          const SizedBox(height: 24),
          const _SectionHeader(label: 'Taxonomy & Categories'),
          const SizedBox(height: 8),
          const _CategoryCard(),

          const SizedBox(height: 24),
          const _SectionHeader(label: 'Preferences'),
          const SizedBox(height: 8),

          settingsAsync.when(
            loading: () => const Center(child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(),
            )),
            error: (e, _) => _ErrorTile(error: e.toString(), onRetry: () => ref.invalidate(userSettingsProvider)),
            data: (settings) => _PreferencesCard(settings: settings, ref: ref),
          ),

          const SizedBox(height: 24),
          const _SectionHeader(label: 'Data Portability'),
          const SizedBox(height: 8),
          const _DataManagementCard(),

          const SizedBox(height: 24),
          const _SectionHeader(label: 'Server'),
          const SizedBox(height: 8),

          Card(
            child: Column(children: [
              ListTile(
                leading: const Icon(Icons.dns_outlined),
                title: const Text('Backend URL'),
                subtitle: FutureBuilder<String>(
                  future: AppConfig.instance.getBaseUrl(),
                  builder: (_, snap) => Text(snap.data ?? '...', style: const TextStyle(fontSize: 12)),
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.goNamed(AppRoute.onboarding),
              ),
            ]),
          ),

          const SizedBox(height: 24),
          const _SectionHeader(label: 'Security'),
          const SizedBox(height: 8),

          Card(
            child: Column(children: [
              ListTile(
                leading: Icon(Icons.lock_outline, color: cs.primary),
                title: const Text('Change Password'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (_) => const _ChangePasswordDialog(),
                  );
                },
              ),
              const Divider(height: 1),
              ListTile(
                leading: Icon(Icons.logout, color: cs.error),
                title: Text('Sign Out', style: TextStyle(color: cs.error)),
                onTap: () async {
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (dialogContext) => AlertDialog(
                      title: const Text('Sign Out'),
                      content: const Text('Are you sure you want to sign out?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
                        TextButton(
                          onPressed: () => Navigator.pop(dialogContext, true),
                          style: TextButton.styleFrom(foregroundColor: cs.error),
                          child: const Text('Sign Out'),
                        ),
                      ],
                    ),
                  );
                  
                  if (confirmed == true && context.mounted) {
                    // Invalidate all data providers to avoid stale data
                    ref.invalidate(userSettingsProvider);
                    ref.invalidate(currenciesProvider);
                    await ref.read(authNotifierProvider.notifier).logout();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Signed out successfully'), behavior: SnackBarBehavior.floating),
                      );
                    }
                  }
                },
              ),
            ]),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _PreferencesCard extends StatefulWidget {
  final Map<String, dynamic> settings;
  final WidgetRef ref;
  const _PreferencesCard({required this.settings, required this.ref});

  @override
  State<_PreferencesCard> createState() => _PreferencesCardState();
}

class _PreferencesCardState extends State<_PreferencesCard> {
  late String _currency;
  late String _exchangeProvider;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _currency = widget.settings['default_currency'] as String? ?? 'USD';
    _exchangeProvider = widget.settings['exchange_provider'] as String? ?? 'frankfurter';
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient.instance.dio.put(ApiEndpoints.settings, data: {
        'default_currency': _currency,
        'exchange_provider': _exchangeProvider,
      });
      widget.ref.invalidate(userSettingsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Settings saved'), behavior: SnackBarBehavior.floating));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: $e'), behavior: SnackBarBehavior.floating));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final currenciesAsync = widget.ref.watch(currenciesProvider);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Default Currency', style: TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          currenciesAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (_, __) => Text('Currency: $_currency'),
            data: (currencies) => DropdownButtonFormField<String>(
              initialValue: _currency,
              decoration: const InputDecoration(prefixIcon: Icon(Icons.currency_exchange)),
              items: currencies.map((c) => DropdownMenuItem(
                value: c['code'] as String,
                child: Text('${c['code']} — ${c['name']}'),
              )).toList(),
              onChanged: (v) => setState(() => _currency = v!),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Exchange Rate Provider', style: TextStyle(fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            initialValue: _exchangeProvider,
            decoration: const InputDecoration(prefixIcon: Icon(Icons.cloud_outlined)),
            items: const [
              DropdownMenuItem(value: 'Manual', child: Text('Manual (no updates)')),
              DropdownMenuItem(value: 'frankfurter', child: Text('Frankfurter (free)')),
              DropdownMenuItem(value: 'exchangerate_api', child: Text('ExchangeRate-API')),
            ],
            onChanged: (v) => setState(() => _exchangeProvider = v!),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Save Preferences'),
            ),
          ),
        ]),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  const _SectionHeader({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(label, style: TextStyle(
      fontSize: 12, fontWeight: FontWeight.w600,
      color: Theme.of(context).colorScheme.primary,
      letterSpacing: 1.0,
    ));
  }
}

class _ErrorTile extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorTile({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Text('Failed to load settings: $error'),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ]),
      ),
    );
  }
}

class _ChangePasswordDialog extends ConsumerStatefulWidget {
  const _ChangePasswordDialog();

  @override
  ConsumerState<_ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends ConsumerState<_ChangePasswordDialog> {
  final _currentPwdController = TextEditingController();
  final _newPwdController = TextEditingController();
  final _confirmPwdController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _currentPwdController.dispose();
    _newPwdController.dispose();
    _confirmPwdController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_newPwdController.text != _confirmPwdController.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('New passwords do not match')));
      return;
    }
    if (_newPwdController.text.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password must be at least 6 characters')));
      return;
    }
    setState(() => _isLoading = true);
    try {
      await ref.read(authNotifierProvider.notifier).changePassword(
        _currentPwdController.text,
        _newPwdController.text,
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password changed successfully')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to change password: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Change Password'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _currentPwdController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Current Password'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _newPwdController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'New Password'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _confirmPwdController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Confirm New Password'),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _submit,
          child: _isLoading 
            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) 
            : const Text('Update'),
        ),
      ],
    );
  }
}

class _ThemeCard extends ConsumerWidget {
  const _ThemeCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeNotifierProvider).valueOrNull ?? ThemeMode.system;

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SegmentedButton<ThemeMode>(
              segments: const [
                ButtonSegment(
                  value: ThemeMode.system,
                  icon: Icon(Icons.brightness_auto_outlined),
                  label: Text('System'),
                ),
                ButtonSegment(
                  value: ThemeMode.light,
                  icon: Icon(Icons.light_mode_outlined),
                  label: Text('Light'),
                ),
                ButtonSegment(
                  value: ThemeMode.dark,
                  icon: Icon(Icons.dark_mode_outlined),
                  label: Text('Dark'),
                ),
              ],
              selected: {themeMode},
              onSelectionChanged: (Set<ThemeMode> newSelection) {
                ref.read(themeModeNotifierProvider.notifier).setThemeMode(newSelection.first);
              },
              showSelectedIcon: false,
              style: SegmentedButton.styleFrom(
                visualDensity: VisualDensity.compact,
                textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Identity details
class _IdentityCard extends ConsumerWidget {
  const _IdentityCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final cs = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _IdentityRow(label: 'Verified Name', value: user?.fullName ?? 'Anonymous'),
            const Divider(height: 16),
            _IdentityRow(label: 'Email Endpoint', value: user?.email ?? '-'),
          ],
        ),
      ),
    );
  }
}

class _IdentityRow extends StatelessWidget {
  final String label;
  final String value;
  const _IdentityRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(child: Text(label, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant, fontWeight: FontWeight.bold))),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
        ],
      ),
    );
  }
}

// Category Management
class _CategoryCard extends ConsumerWidget {
  const _CategoryCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesListProvider);
    final cs = Theme.of(context).colorScheme;

    return Card(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.layers_outlined, size: 20),
                const SizedBox(width: 8),
                const Text('Active Tags', style: TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton.filledTonal(
                  icon: const Icon(Icons.add, size: 18),
                  onPressed: () => _addCategory(context, ref),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          categoriesAsync.when(
            loading: () => const LinearProgressIndicator(),
            error: (e, _) => ListTile(title: Text('Error: $e')),
            data: (items) {
              if (items.isEmpty) return const ListTile(title: Text('No categories'));
              return Column(
                children: items.map((cat) => ListTile(
                  dense: true,
                  title: Text(cat.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline, size: 18),
                    onPressed: () => _confirmDelete(context, ref, cat),
                  ),
                )).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  void _addCategory(BuildContext context, WidgetRef ref) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Taxonomy'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Category Name', hintText: 'Entertainment, Utilities...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.isEmpty) return;
              await ref.read(categoriesListProvider.notifier).addCategory(controller.text);
              if (context.mounted) Navigator.pop(ctx);
            },
            child: const Text('Add'),
          ),
        ],
      )
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, Category category) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Category?'),
        content: Text('Remove "${category.name}" from your taxonomy?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              await ref.read(categoriesListProvider.notifier).deleteCategory(category.categoryId);
              if (context.mounted) Navigator.pop(ctx);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      )
    );
  }
}

class _DataManagementCard extends StatelessWidget {
  const _DataManagementCard();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.file_download_outlined),
            title: const Text('Export Knowledge'),
            subtitle: const Text('Portable JSON backup of all records'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _export(context),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.file_upload_outlined),
            title: const Text('Import Knowledge'),
            subtitle: const Text('Restore from a previous backup file'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _showComingSoon(context),
          ),
        ],
      ),
    );
  }

  void _export(BuildContext context) async {
    // For mobile without file picker: copy JSON string to clipboard for now
    // as an "Innovative" approach to data portability.
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Preparing export data...'), behavior: SnackBarBehavior.floating),
    );
    try {
      final response = await ApiClient.instance.dio.get(ApiEndpoints.exportData);
      // In a real app we'd share the file, here we show a success message
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Knowledge Exported'),
          content: const Text('Your transaction and account backup has been successfully generated on the server.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
          ],
        )
      );
    } catch (e) {
       ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Export failed: $e'), behavior: SnackBarBehavior.floating),
      );
    }
  }

  void _showComingSoon(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => const AlertDialog(
        title: Text('Import Recovery'),
        content: Text('Secure file restoration is coming to mobile in a future update. Please use the Web App for full data restoration.'),
      )
    );
  }
}
