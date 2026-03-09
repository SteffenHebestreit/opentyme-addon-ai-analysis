/**
 * OpenTYME Addon Backend Types
 *
 * These interfaces mirror the types provided by the OpenTYME host.
 * Do not change the shape — the host injects real implementations at runtime.
 */

import { Router } from 'express';

export interface AddonPlugin {
  name: string;
  /**
   * Called once at startup. Register your route handlers on `this.routes` here.
   * The `context` object provides database access, logging, and the Express app.
   */
  initialize?: (context: PluginContext) => Promise<void>;
  /** An Express Router. Mount your handlers in `initialize`. */
  routes?: Router;
  /** Called when a new user is created. Optional per-user setup. */
  onUserInit?: (userId: string) => Promise<void>;
  /** Called on graceful shutdown. Close connections, flush caches, etc. */
  shutdown?: () => Promise<void>;
}

export interface PluginLogger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

export interface CustomToolParameter {
  type: 'string' | 'number' | 'boolean' | 'integer' | 'array' | 'object';
  description?: string;
  enum?: (string | number)[];
  items?: CustomToolParameter;
  properties?: Record<string, CustomToolParameter>;
}

export interface AIContext {
  registerTool: (tool: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, CustomToolParameter>;
      required?: string[];
    };
    execute: (args: Record<string, unknown>) => Promise<unknown>;
  }) => void;
  registerSystemPromptExtension: (pluginName: string, text: string) => void;
}

/**
 * Injected by OpenTYME when your plugin is initialized.
 * - `database` — PostgreSQL pool (pg.Pool). Use `database.query(sql, params)`.
 * - `logger`   — Structured logger (Winston-compatible).
 * - `app`      — Express application instance (for advanced use only).
 * - `ai`       — AI integration hooks (always present).
 *
 * Authentication is applied automatically — req.user is always populated.
 */
export interface PluginContext {
  database: {
    query: (sql: string, params?: any[]) => Promise<{ rows: any[] }>;
  };
  logger: PluginLogger;
  app: any;
  ai: AIContext;
}

export interface PluginSettings {
  enabled: boolean;
  config: Record<string, any>;
}
