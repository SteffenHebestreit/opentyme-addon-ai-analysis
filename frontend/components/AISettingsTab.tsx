/**
 * AI Settings Configuration Tab
 *
 * Allows users to configure AI providers, models, and analysis preferences.
 * Exposed as a settings-tabs slot component. The static tabMeta property tells
 * AdminPage how to render the tab button.
 */

import React, { useState, useEffect } from 'react';
import { usePluginSettings } from '../hooks/usePluginSettings';

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
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync settings into form once loaded (avoids useState initialisation race)
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

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      alert('AI settings saved successfully!');
    } catch (err) {
      console.error('Failed to save AI settings:', err);
      alert('Failed to save settings. Please try again.');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const response = await fetch(`/api/plugins/${PLUGIN_NAME}/health`, {
        credentials: 'include',
      });
      const data = await response.json();
      const healthy = data.success && data.mcp_server?.healthy;
      setTestResult({
        success: healthy,
        message: healthy
          ? `Connected to MCP server at ${data.mcp_server.url}`
          : 'MCP server is not responding',
      });
    } catch (err: any) {
      setTestResult({ success: false, message: `Connection failed: ${err.message}` });
    } finally {
      setTestingConnection(false);
    }
  };

  if (isLoading) return <div className="p-6">Loading AI settings...</div>;

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">Failed to load AI settings</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Analysis Settings</h2>
        <p className="text-gray-600">
          Configure AI providers for receipt extraction and depreciation analysis.
        </p>
      </div>

      {/* Master Enable */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enable AI Analysis</h3>
            <p className="text-sm text-gray-600">Master switch for all AI features</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.ai_enabled}
              onChange={(e) => handleChange('ai_enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {formData.ai_enabled && (
        <>
          {/* AI Provider Settings */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Provider Configuration</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
              <select
                value={formData.ai_provider}
                onChange={(e) => handleChange('ai_provider', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="local">Local (LM Studio)</option>
                <option value="openai">OpenAI</option>
                <option value="azure">Azure OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API URL</label>
              <input
                type="text"
                value={formData.ai_api_url}
                onChange={(e) => handleChange('ai_api_url', e.target.value)}
                placeholder="http://localhost:1234/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">Base URL for the AI API endpoint</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key {formData.ai_provider !== 'local' && '(Required)'}
              </label>
              <input
                type="password"
                value={formData.ai_api_key}
                onChange={(e) => handleChange('ai_api_key', e.target.value)}
                placeholder={formData.ai_provider === 'local' ? 'Optional' : 'Enter your API key'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
              <input
                type="text"
                value={formData.ai_model}
                onChange={(e) => handleChange('ai_model', e.target.value)}
                placeholder="qwen/qwen3-v1-30b"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Model identifier (e.g., qwen/qwen3-v1-30b, gpt-4, claude-opus-4-6)
              </p>
            </div>
          </div>

          {/* MCP Server Settings */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">MCP Server (PDF Extraction)</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">MCP Server URL</label>
              <input
                type="text"
                value={formData.mcp_server_url}
                onChange={(e) => handleChange('mcp_server_url', e.target.value)}
                placeholder="http://mcp-server:8000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MCP Server API Key (Optional)
              </label>
              <input
                type="password"
                value={formData.mcp_server_api_key}
                onChange={(e) => handleChange('mcp_server_api_key', e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {testingConnection ? 'Testing...' : 'Test MCP Connection'}
              </button>
              {testResult && (
                <div
                  className={`mt-2 p-3 rounded ${
                    testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {testResult.success ? '✓' : '✗'} {testResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Preferences */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Preferences</h3>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-Analyze Receipts</label>
                <p className="text-sm text-gray-500">Automatically analyze uploaded PDFs</p>
              </div>
              <input
                type="checkbox"
                checked={formData.auto_analyze}
                onChange={(e) => handleChange('auto_analyze', e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Confidence Threshold:{' '}
                {(formData.min_confidence_threshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.min_confidence_threshold}
                onChange={(e) =>
                  handleChange('min_confidence_threshold', parseFloat(e.target.value))
                }
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Only accept AI suggestions with confidence above this threshold
              </p>
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
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
