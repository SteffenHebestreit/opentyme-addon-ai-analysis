/**
 * AI Expense Analysis Plugin - Frontend Entry Point
 *
 * Exports the AddonFrontendPlugin that OpenTYME's plugin loader will pick up.
 * Slots receive the host's context object as props — see ADDON_DEVELOPMENT_GUIDE.md.
 */

import type { AddonFrontendPlugin } from './src/types';
import { DepreciationAnalysisSection } from './components/DepreciationAnalysisSection';

const plugin: AddonFrontendPlugin = {
  name: 'ai-expense-analysis',

  slots: {
    // Injected into the bottom of AddExpenseModal
    // Context: { setDescription, setAmount, setCurrency, setCategory, setExpenseDate, setNotes }
    'expense-form-actions': DepreciationAnalysisSection,
  },

  async initialize(): Promise<void> {
    console.log('[AI Analysis Plugin] Frontend initialized');
  },
};

export default plugin;
