'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './ToastContext';

export interface ManagerPreferences {
  defaultProject: string;
  defaultDashboardView: 'health' | 'milestones' | 'critical-path' | 'variance';
  pinnedCards: string[];
  sCurveRange: '1m' | '3m' | '6m' | 'all';
  sCurveSeries: { planned: boolean; actual: boolean; forecast: boolean };
  reviewQueueFilterDefault: 'all' | 'high-confidence' | 'pending' | 'unmatched';
  criticalPathAlertDays: number;
}

export interface EngineerPreferences {
  defaultWorkPackage: string;
  defaultUnit: string;
  preferredDateFormat: 'project' | 'iso';
  touchTargetScale: 'standard' | 'glove';
  draftReminder: boolean;
  quickCaptureDiscipline: string;
  quickCaptureTemplates?: string[];
}

export interface SharedPreferences {
  density: 'comfortable' | 'compact';
  highContrastFocus: boolean;
  accessibleChartLabels: boolean;
  language: string;
}

interface PreferencesContextType {
  manager: ManagerPreferences;
  engineer: EngineerPreferences;
  shared: SharedPreferences;
  preferences: {
    manager: ManagerPreferences;
    engineer: EngineerPreferences;
    shared: SharedPreferences;
    isGloveMode: boolean;
  };
  updateManager: (updates: Partial<ManagerPreferences>) => void;
  updateEngineer: (updates: Partial<EngineerPreferences>) => void;
  updateShared: (updates: Partial<SharedPreferences>) => void;
  resetToDefaults: () => void;
  isSettingsOpen: boolean;
  settingsTab: 'manager' | 'engineer' | 'shared';
  openSettings: (tab?: 'manager' | 'engineer' | 'shared') => void;
  closeSettings: () => void;
  setSettingsTab: (tab: 'manager' | 'engineer' | 'shared') => void;
}

const DEFAULT_MANAGER: ManagerPreferences = {
  defaultProject: 'PRJ-OIL-2026-01',
  defaultDashboardView: 'health',
  pinnedCards: ['kpi-summary', 'urgent-actions', 's-curve', 'milestones'],
  sCurveRange: 'all',
  sCurveSeries: { planned: true, actual: true, forecast: true },
  reviewQueueFilterDefault: 'all',
  criticalPathAlertDays: 3,
};

const DEFAULT_ENGINEER: EngineerPreferences = {
  defaultWorkPackage: 'PIP-24-001',
  defaultUnit: 'spools',
  preferredDateFormat: 'project',
  touchTargetScale: 'standard',
  draftReminder: true,
  quickCaptureDiscipline: 'All',
  quickCaptureTemplates: [],
};

const DEFAULT_SHARED: SharedPreferences = {
  density: 'comfortable',
  highContrastFocus: false,
  accessibleChartLabels: true,
  language: 'en',
};

const STORAGE_KEY = 'plnex_ui_display_preferences';

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [manager, setManager] = useState<ManagerPreferences>(DEFAULT_MANAGER);
  const [engineer, setEngineer] = useState<EngineerPreferences>(DEFAULT_ENGINEER);
  const [shared, setShared] = useState<SharedPreferences>(DEFAULT_SHARED);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'manager' | 'engineer' | 'shared'>('manager');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.manager) setManager((prev) => ({ ...prev, ...parsed.manager }));
        if (parsed.engineer) setEngineer((prev) => ({ ...prev, ...parsed.engineer }));
        if (parsed.shared) setShared((prev) => ({ ...prev, ...parsed.shared }));
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveToStorage = (m: ManagerPreferences, e: EngineerPreferences, s: SharedPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ manager: m, engineer: e, shared: s }));
    } catch {
      // Ignore
    }
  };

  const updateManager = (updates: Partial<ManagerPreferences>) => {
    setManager((prev) => {
      const next = { ...prev, ...updates };
      saveToStorage(next, engineer, shared);
      return next;
    });
  };

  const updateEngineer = (updates: Partial<EngineerPreferences>) => {
    setEngineer((prev) => {
      const next = { ...prev, ...updates };
      saveToStorage(manager, next, shared);
      return next;
    });
  };

  const updateShared = (updates: Partial<SharedPreferences>) => {
    setShared((prev) => {
      const next = { ...prev, ...updates };
      saveToStorage(manager, engineer, next);
      return next;
    });
  };

  const resetToDefaults = () => {
    setManager(DEFAULT_MANAGER);
    setEngineer(DEFAULT_ENGINEER);
    setShared(DEFAULT_SHARED);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const openSettings = (tab: 'manager' | 'engineer' | 'shared' = 'manager') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const isGloveMode = engineer.touchTargetScale === 'glove';

  return (
    <PreferencesContext.Provider
      value={{
        manager,
        engineer,
        shared,
        preferences: {
          manager,
          engineer,
          shared,
          isGloveMode,
        },
        updateManager,
        updateEngineer,
        updateShared,
        resetToDefaults,
        isSettingsOpen,
        settingsTab,
        openSettings,
        closeSettings,
        setSettingsTab,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
