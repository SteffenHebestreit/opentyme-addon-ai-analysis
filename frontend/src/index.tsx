/**
 * AI Expense Analysis Plugin - Frontend
 * 
 * Provides UI components for AI-powered expense analysis features.
 */

import React from 'react';
import type { FrontendPlugin } from './types';
import { DepreciationAnalysisSection } from '../components/DepreciationAnalysisSection';
import { AISettingsTab } from '../components/AISettingsTab';

const plugin: FrontendPlugin = {
  name: 'ai-expense-analysis',
  version: '1.0.0',

  initialize: () => {
    console.log('[AI Analysis Plugin] Frontend initialized');
  },

  slots: {
    // Inject AI analysis section into expense form
    'expense-form-actions': {
      component: DepreciationAnalysisSection,
      order: 10,
    },
    
    // Add AI settings tab to settings page
    'settings-tabs': {
      component: AISettingsTab,
      order: 20,
    },
  },
};

export default plugin;
