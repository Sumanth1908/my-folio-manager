import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/config/app_config.dart';
import '../../core/api/api_client.dart';
import '../../core/router/app_router.dart';
import '../../core/providers/auth_provider.dart';

class ServerConfigScreen extends ConsumerStatefulWidget {
  const ServerConfigScreen({super.key});

  @override
  ConsumerState<ServerConfigScreen> createState() => _ServerConfigScreenState();
}

class _ServerConfigScreenState extends ConsumerState<ServerConfigScreen> {
  final _controller = TextEditingController(text: AppConfig.defaultBaseUrl);
  bool _testing = false;
  bool _saving = false;
  bool? _testResult; // null = not tested, true = ok, false = failed

  @override
  void initState() {
    super.initState();
    // Pre-fill with saved URL if available
    AppConfig.instance.getBaseUrl().then((url) {
      if (mounted) _controller.text = url;
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    setState(() { _testing = true; _testResult = null; });
    final ok = await AppConfig.instance.testConnection(_controller.text.trim());
    setState(() { _testing = false; _testResult = ok; });
  }

  Future<void> _saveAndContinue() async {
    setState(() => _saving = true);
    try {
      await AppConfig.instance.saveBaseUrl(_controller.text.trim());
      await ApiClient.instance.reinit();
      
      // Explicitly clear any existing session tokens to prevent 
      // GoRouter auto-redirecting to dashboard with invalid tokens
      await AppConfig.instance.clearToken();
      
      if (mounted) {
        // Force Riverpod to rebuild auth state logic 
        ref.invalidate(authNotifierProvider);
        context.goNamed(AppRoute.login);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save configuration: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (context.canPop())
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new, size: 20),
                    onPressed: () => context.pop(),
                  ),
                ),
              SizedBox(height: context.canPop() ? 16 : 48),
              // Logo / Icon
              Container(
                width: 64, height: 64,
                decoration: BoxDecoration(
                  color: cs.primaryContainer,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(Icons.account_balance, size: 36, color: cs.primary),
              ),
              const SizedBox(height: 24),
              Text('Connect to your server',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                'Enter the URL of your My Folio Manager backend. You can change this later from Settings.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: cs.onSurfaceVariant),
              ),
              const SizedBox(height: 40),
              Text('Backend URL', style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 8),
              TextField(
                controller: _controller,
                keyboardType: TextInputType.url,
                autocorrect: false,
                decoration: InputDecoration(
                  hintText: 'http://192.168.1.10:8000',
                  prefixIcon: const Icon(Icons.link),
                  suffixIcon: _testResult == null ? null :
                    Icon(_testResult! ? Icons.check_circle : Icons.error,
                      color: _testResult! ? Colors.greenAccent : cs.error),
                ),
                onChanged: (_) => setState(() => _testResult = null),
              ),

              if (_testResult == false) ...[
                const SizedBox(height: 8),
                Text('Cannot reach server. Check the URL and ensure the backend is running.',
                  style: TextStyle(color: cs.error, fontSize: 12)),
              ],
              if (_testResult == true) ...[
                const SizedBox(height: 8),
                const Text('✓ Server reachable!',
                  style: TextStyle(color: Colors.greenAccent, fontSize: 12)),
              ],

              const SizedBox(height: 16),
              OutlinedButton.icon(
                onPressed: _testing ? null : _testConnection,
                icon: _testing
                  ? const SizedBox(width: 16, height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.wifi_find),
                label: Text(_testing ? 'Testing…' : 'Test Connection'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),

              const Spacer(),
              ElevatedButton(
                onPressed: _saving ? null : _saveAndContinue,
                child: _saving
                  ? const SizedBox(width: 24, height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save & Continue'),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
