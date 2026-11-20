'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PortfolioProject, UserRole, UserSession, DataState, ScheduleActivity } from '../types';
import { MOCK_PROJECTS } from '../lib/api/mockData';
import { ActivityDrawerTab } from '../lib/domain/activityDetailData';
import { authService, StoredSession } from '../lib/api/authService';
import { WhyExplanationData, getWhyExplanation } from '../lib/domain/whyExplanations';
import { MASTER_CANONICAL_ACTIVITIES } from '../lib/domain/canonicalModels';
import { projectService } from '../lib/api/projectService';

interface AppContextType {
  activeProject: PortfolioProject;
  setActiveProjectId: (id: string) => void;
  allProjects: PortfolioProject[];
  addProject: (project: PortfolioProject) => void;
  // Master Schedule & Closed Loop Execution State
  activities: ScheduleActivity[];
  updateActivityProgress: (activityId: string, progress: number, quantity?: number) => void;
  approveExecutionEvent: (eventId: string, activityId?: string | null, progressDelta?: number) => void;
  userSession: UserSession | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (email: string, password: string, remember?: boolean) => { success: boolean; session?: StoredSession; error?: string };
  logout: () => void;
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
  // Global "Why?" Transparent Explanation Panel
  whyModalData: import('../lib/domain/whyExplanations').WhyExplanationData | null;
  openWhyExplanation: (keyOrData: string | import('../lib/domain/whyExplanations').WhyExplanationData, fallbackSubjectId?: string) => void;
  closeWhyExplanation: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [allProjects, setAllProjects] = useState<PortfolioProject[]>(MOCK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>(MOCK_PROJECTS[0].id);
  const [activities, setActivities] = useState<ScheduleActivity[]>(() => [...MASTER_CANONICAL_ACTIVITIES]);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [simulatedState, setSimulatedState] = useState<DataState>('success');
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activityDrawerActivityId, setActivityDrawerActivityId] = useState<string | null>(null);
  const [activityDrawerTab, setActivityDrawerTab] = useState<ActivityDrawerTab>('overview');
  const [whyModalData, setWhyModalData] = useState<WhyExplanationData | null>(null);

  const updateActivityProgress = (activityId: string, progress: number, quantity?: number) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id === activityId || act.activityId === activityId) {
          const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
          const actualQty =
            quantity !== undefined
              ? quantity
              : act.plannedQuantity
                ? Math.min(act.plannedQuantity, Math.round((clampedProgress / 100) * act.plannedQuantity))
                : act.actualQuantity;
          const variance = clampedProgress - act.plannedProgress;
          const newStatus =
            clampedProgress >= 100
              ? 'completed'
              : clampedProgress > 0
                ? 'in_progress'
                : act.status;

          return {
            ...act,
            actualProgress: clampedProgress,
            verifiedActualProgress: clampedProgress,
            actualQuantity: actualQty,
            variance,
            status: newStatus as any,
          };
        }
        return act;
      })
    );
  };

  const approveExecutionEvent = (eventId: string, activityId?: string | null, progressDelta?: number) => {
    try {
      projectService.approveMatch(eventId, 'Approved via Field-to-Schedule closed loop verification');
    } catch {
      // Ignore if event not in mock service
    }

    let targetId = activityId;
    if (!targetId) {
      try {
        const matchingEvt = (projectService as any).events?.find((e: any) => e.id === eventId);
        if (matchingEvt?.matchedActivityId) {
          targetId = matchingEvt.matchedActivityId;
        }
      } catch {
        // no-op
      }
    }

    if (!targetId && eventId.includes('24')) {
      targetId = 'PIP-24-002';
    }

    if (targetId) {
      setActivities((prev) =>
        prev.map((act) => {
          if (act.id === targetId || act.activityId === targetId) {
            const delta = progressDelta ?? 5;
            const newProgress = Math.min(100, Math.round(act.actualProgress + delta));
            const actualQty = act.plannedQuantity
              ? Math.min(act.plannedQuantity, Math.round((newProgress / 100) * act.plannedQuantity))
              : act.actualQuantity;
            const variance = newProgress - act.plannedProgress;
            const newStatus =
              newProgress >= 100
                ? 'completed'
                : newProgress > 0
                  ? 'in_progress'
                  : act.status;
            const existingEvtIds = act.executionEventIds || [];
            return {
              ...act,
              actualProgress: newProgress,
              verifiedActualProgress: newProgress,
              actualQuantity: actualQty,
              variance,
              status: newStatus as any,
              executionEventIds: existingEvtIds.includes(eventId) ? existingEvtIds : [...existingEvtIds, eventId],
            };
          }
          return act;
        })
      );
    }
  };

  const openWhyExplanation = (
    keyOrData: string | WhyExplanationData,
    fallbackSubjectId?: string
  ) => {
    if (typeof keyOrData === 'string') {
      const data = getWhyExplanation(keyOrData, fallbackSubjectId);
      setWhyModalData(data);
    } else {
      setWhyModalData(keyOrData);
    }
  };

  const closeWhyExplanation = () => {
    setWhyModalData(null);
  };

  // Check stored session on mount
  useEffect(() => {
    const session = authService.getCurrentSession();
    if (session && session.user) {
      setUserSession(session.user);
      setIsAuthenticated(true);
    } else {
      setUserSession(null);
      setIsAuthenticated(false);
    }
    setIsAuthReady(true);
  }, []);

  const handleLogin = (email: string, password: string, remember: boolean = true) => {
    const res = authService.login(email, password, remember);
    if (res.success && res.session) {
      setUserSession(res.session.user);
      setIsAuthenticated(true);
    }
    return res;
  };

  const handleLogout = () => {
    authService.logout();
    setUserSession(null);
    setIsAuthenticated(false);
  };

  const handleSetUserRole = (role: UserRole) => {
    let name = 'Rajesh Sharma';
    let title = 'Chief Project Controls Manager';
    let avatar = 'RS';

    if (role === 'engineer') {
      name = 'Debajit Borah';
      title = 'Lead Site Execution Engineer';
      avatar = 'DB';
    } else if (role === 'admin') {
      name = 'Jatin Kumar';
      title = 'Enterprise Infrastructure Systems Lead';
      avatar = 'JK';
    }

    const updatedUser: UserSession = userSession
      ? {
          ...userSession,
          role,
          name,
          title,
          avatar,
        }
      : {
          id: `USR-${role.toUpperCase()}-001`,
          name,
          email: `${role}@oilindia.in`,
          role,
          title,
          organization: 'Oil India Limited',
          avatar,
        };

    authService.createSession(updatedUser, true);
    setUserSession(updatedUser);
    setIsAuthenticated(true);
  };

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

  return (
    <AppContext.Provider
      value={{
        activeProject,
        setActiveProjectId,
        allProjects,
        addProject,
        activities,
        updateActivityProgress,
        approveExecutionEvent,
        userSession,
        isAuthenticated,
        isAuthReady,
        login: handleLogin,
        logout: handleLogout,
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
        whyModalData,
        openWhyExplanation,
        closeWhyExplanation,
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
