import React from 'react';

export interface AddonFrontendPlugin {
  name: string;
  routes?: LoadedRoute[];
  slots?: Record<string, React.ComponentType<any>>;
  initialize?: () => Promise<void>;
}

export interface LoadedRoute {
  path: string;
  component: React.ComponentType<any>;
  protected: boolean;
}

export interface SlotContext {
  [key: string]: any;
}
