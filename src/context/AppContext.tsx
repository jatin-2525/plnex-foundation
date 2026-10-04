'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PortfolioProject, UserRole, UserSession, DataState } from '../types';
import { MOCK_PROJECTS } from '../lib/api/mockData';
import { ActivityDrawerTab } from '../lib/domain/activityDetailData';

interface AppContextType {
  activeProject: PortfolioProject;
  setActiveProjectId: (id: string) => void;
  allProjects: PortfolioProject[];
  addProject: (project: PortfolioProject) => void;
  userSession: UserSession;
  setUserRole: (role: UserRole) => void;
  // Demo State simulation for testing and verification
  simulatedState: DataState;
  setSimulatedState: (state: DataState) => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  notificationOpen: boolean;
  setNotificationOpen: (open: boolean) => void;
  // Reusable Activity Detail Drawer State
  activityDrawerActivityId: string | null;
  activityDrawerTab: ActivityDrawerTab;
  openActivityDrawer: (id: string, initialTab?: ActivityDrawerTab) => void;
  closeActivityDrawer: () => void;
}

const defaultUserSession: UserSession = {
  id: 'USR-OIL-001',
  name: 'Rajesh Sharma',
  email: 'rajesh.sharma@oilindia.in',
  role: 'manager',
  title: 'Chief Project Controls Manager',
  organization: 'Oil India Limited — Infrastructure Division',
  avatar: 'RS',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [allProjects, setAllProjects] = useState<PortfolioProject[]>(MOCK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(MOCK_PROJECTS[0].id);
  const [userSession, setUserSession] = useState<UserSession>(defaultUserSession);
  const [simulatedState, setSimulatedState] = useState<DataState>('success');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activityDrawerActivityId, setActivityDrawerActivityId] = useState<string | null>(null);
  const [activityDrawerTab, setActivityDrawerTab] = useState<ActivityDrawerTab>('overview');

  const openActivityDrawer = (id: string, initialTab: ActivityDrawerTab = 'overview') => {
    setActivityDrawerActivityId(id);
    setActivityDrawerTab(initialTab);
  };

  const closeActivityDrawer = () => {
    setActivityDrawerActivityId(null);
  };

  const addProject = (project: PortfolioProject) => {
    setAllProjects((prev) => [project, ...prev]);
  };

  const activeProject = allProjects.find((p) => p.id === activeProjectId) || allProjects[0];

  const handleSetUserRole = (role: UserRole) => {
    let name = 'Rajesh Sharma';
    let title = 'Chief Project Controls Manager';
    let avatar = 'RS';

    if (role === 'engineer') {
      name = 'Debajit Borah';
      title = 'Lead Site Execution Engineer';
      avatar = 'DB';
    } else if (role === 'admin') {
      name = 'System Administrator';
      title = 'Infrastructure Systems Lead';
      avatar = 'SA';
    } else if (role === 'viewer') {
      name = 'Audit Observer';
      title = 'Project Oversight Committee';
      avatar = 'AO';
    }

    setUserSession({
      ...userSession,
      role,
      name,
      title,
      avatar,
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeProject,
        setActiveProjectId,
        allProjects,
        addProject,
        userSession,
        setUserRole: handleSetUserRole,
        simulatedState,
        setSimulatedState,
        globalSearchOpen,
        setGlobalSearchOpen,
        notificationOpen,
        setNotificationOpen,
        activityDrawerActivityId,
        activityDrawerTab,
        openActivityDrawer,
        closeActivityDrawer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
