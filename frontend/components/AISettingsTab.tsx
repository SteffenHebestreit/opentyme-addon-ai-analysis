/**
 * AI Analysis Settings Tab
 *
 * Allows users to configure AI providers, models, and analysis preferences.
 * Exposed as a settings-tabs slot component. The static tabMeta property tells
 * AdminPage how to render the tab button.
 */

import React, { useState, useEffect } from 'react';
import { usePluginSettings } from '../hooks/usePluginSettings';
import { getAccessToken } from '../../../services/auth/tokenManager';

const PLUGIN_NAME = 'ai-expense-analysis';

const DEFAULT_FORM = {
  ai_enabled: false,
  ai_provider: 'local',
  ai_api_url: 'http://localhost:1234/v1',
  ai_api_key: '',
  ai_model: 'qwen/qwen3-v1-30b',
  mcp_server_url: 'http://mcp-server:8000',
  mcp_server_api_key: '',
  auto_analyze: true,
  min_confidence_threshold: 0.7,
};

export const AISettingsTab: React.FC = () => {
  const { data: settings, isLoading, error, updateSettings, isSaving } = usePluginSettings(PLUGIN_NAME);

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [saveMessage, setSaveMessage] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({
        ai_enabled: settings.ai_enabled ?? false,
        ai_provider: settings.ai_provider ?? 'local',
        ai_api_url: settings.ai_api_url ?? 'http://localhost:1234/v1',
        ai_api_key: settings.ai_api_key ?? '',
        ai_model: settings.ai_model ?? 'qwen/qwen3-v1-30b',
        mcp_server_url: settings.mcp_server_url ?? 'http://mcp-server:8000',
        mcp_server_api_key: settings.mcp_server_api_key ?? '',
        auto_analyze: settings.auto_analyze ?? true,
        min_confidence_threshold: settings.min_confidence_threshold ?? 0.7,
      });
    }
  }, [settings]);

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaveMessage('');
    try {
      await updateSettings(formData);
      setSaveMessage('Settings saved successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch {
      setSaveMessage('Failed to save settings');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const token = getAccessToken();
      const response = await fetch(`/api/plugins/${PLUGIN_NAME}/health`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      const healthy = data.success && data.mcp_server?.healthy;
      setTestResult({
        success: healthy,
        message: healthy
          ? `Connected to MCP server at ${data.mcp_server.url}`
          : 'MCP server is not responding',
      });
    } catch (err: unknown) {
      setTestResult({ success: false, message: `Connection failed: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setTestingConnection(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/20">
        <p className="text-sm text-red-700 dark:text-red-300">Failed to load AI settings. Please reload the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          AI Analysis Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure AI providers for receipt extraction and depreciation analysis.
        </p>
      </div>

      {/* Enable toggle */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">AI Analysis</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={formData.ai_enabled}
            onClick={() => handleChange('ai_enabled', !formData.ai_enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
              formData.ai_enabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.ai_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable AI Analysis
          </span>
        </div>

        {formData.ai_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
            <div>
              <label className={labelClass}>AI Provider</label>
              <select
                value={formData.ai_provider}
                onChange={(e) => handleChange('ai_provider', e.target.value)}
                className={inputClass}
              >
                <option value="local">Local (LM Studio / vLLM)</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="azure">Azure OpenAI</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Model Name</label>
              <input
                type="text"
                value={formData.ai_model}
                onChange={(e) => handleChange('ai_model', e.target.value)}
                className={inputClass}
                placeholder="qwen/qwen3-v1-30b"
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>API URL</label>
              <input
                type="url"
                value={formData.ai_api_url}
                onChange={(e) => handleChange('ai_api_url', e.target.value)}
                className={inputClass}
                placeholder="http://localhost:1234/v1"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Base URL for the AI API endpoint
              </p>
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>
                API Key {formData.ai_provider !== 'local' && '(Required)'}
              </label>
              <input
                type="password"
                value={formData.ai_api_key}
                onChange={(e) => handleChange('ai_api_key', e.target.value)}
                className={inputClass}
                placeholder={formData.ai_provider === 'local' ? 'Optional' : 'sk-...'}
                autoComplete="new-password"
              />
            </div>
          </div>
        )}
      </div>

      {/* MCP Server */}
      {formData.ai_enabled && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">MCP Server (PDF Extraction)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
            <div>
              <label className={labelClass}>MCP Server URL</label>
              <input
                type="url"
                value={formData.mcp_server_url}
                onChange={(e) => handleChange('mcp_server_url', e.target.value)}
                className={inputClass}
                placeholder="http://mcp-server:8000"
              />
            </div>

            <div>
              <label className={labelClass}>MCP Server API Key (optional)</label>
              <input
                type="password"
                value={formData.mcp_server_api_key}
                onChange={(e) => handleChange('mcp_server_api_key', e.target.value)}
                className={inputClass}
                placeholder="Optional"
              />
            </div>

            <div className="md:col-span-2">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm"
              >
                {testingConnection ? 'Testing...' : 'Test MCP Connection'}
              </button>
              {testResult && (
                <p className={`mt-2 text-sm font-medium ${testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {testResult.success ? '✓' : '✗'} {testResult.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Preferences */}
      {formData.ai_enabled && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analysis Preferences</h3>
          <div className="space-y-4 pl-4 border-l-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={formData.auto_analyze}
                onClick={() => handleChange('auto_analyze', !formData.auto_analyze)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  formData.auto_analyze ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.auto_analyze ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-analyze uploaded receipts
              </span>
            </div>

            <div>
              <label className={labelClass}>
                Minimum Confidence: {(formData.min_confidence_threshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.min_confidence_threshold}
                onChange={(e) => handleChange('min_confidence_threshold', parseFloat(e.target.value))}
                className="w-full accent-purple-600"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Only accept AI suggestions above this threshold
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        {saveMessage && (
          <p className={`text-sm font-medium ${
            saveMessage.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  );
};

// Required by AdminPage's settings-tabs slot discovery
(AISettingsTab as any).tabMeta = {
  id: 'ai-analysis',
  label: 'AI Analysis',
  icon: 'Brain',
};

export default AISettingsTab;
