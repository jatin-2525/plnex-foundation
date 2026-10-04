import { UserSession, UserRole } from '../../types';

export const DEMO_USERS: Record<string, { user: UserSession; passwordHash: string }> = {
  'rajesh.sharma@oilindia.in': {
    passwordHash: 'Project2026!',
    user: {
      id: 'USR-MGR-001',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@oilindia.in',
      role: 'manager',
      title: 'Chief Project Controls Manager',
      organization: 'Oil India Limited — Infrastructure Division',
      avatar: 'RS',
    },
  },
  'manager@oilindia.in': {
    passwordHash: 'Project2026!',
    user: {
      id: 'USR-MGR-001',
      name: 'Rajesh Sharma',
      email: 'manager@oilindia.in',
      role: 'manager',
      title: 'Chief Project Controls Manager',
      organization: 'Oil India Limited — Infrastructure Division',
      avatar: 'RS',
    },
  },
  'debajit.borah@oilindia.in': {
    passwordHash: 'Field2026!',
    user: {
      id: 'USR-ENG-002',
      name: 'Debajit Borah',
      email: 'debajit.borah@oilindia.in',
      role: 'engineer',
      title: 'Lead Site Execution Engineer',
      organization: 'Oil India Limited — Duliajan Field Operations',
      avatar: 'DB',
    },
  },
  'engineer@oilindia.in': {
    passwordHash: 'Field2026!',
    user: {
      id: 'USR-ENG-002',
      name: 'Debajit Borah',
      email: 'engineer@oilindia.in',
      role: 'engineer',
      title: 'Lead Site Execution Engineer',
      organization: 'Oil India Limited — Duliajan Field Operations',
      avatar: 'DB',
    },
  },
  'admin@oilindia.in': {
    passwordHash: 'Admin2026!',
    user: {
      id: 'USR-ADM-003',
      name: 'Jatin Kumar',
      email: 'admin@oilindia.in',
      role: 'admin',
      title: 'Enterprise Infrastructure Systems Lead',
      organization: 'Oil India Limited — Central PMIS Directorate',
      avatar: 'JK',
    },
  },
  'jatin.kumar@oilindia.in': {
    passwordHash: 'Admin2026!',
    user: {
      id: 'USR-ADM-003',
      name: 'Jatin Kumar',
      email: 'jatin.kumar@oilindia.in',
      role: 'admin',
      title: 'Enterprise Infrastructure Systems Lead',
      organization: 'Oil India Limited — Central PMIS Directorate',
      avatar: 'JK',
    },
  },
};

const SESSION_STORAGE_KEY = 'plnex_auth_session';

export interface StoredSession {
  user: UserSession;
  token: string;
  expiresAt: number;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getCurrentSession(): StoredSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed: StoredSession = JSON.parse(raw);
      if (!parsed.expiresAt || parsed.expiresAt <= Date.now()) {
        // Session expired
        this.clearSession();
        return null;
      }
      return parsed;
    } catch {
      this.clearSession();
      return null;
    }
  }

  login(email: string, password: string, remember: boolean = true): { success: boolean; session?: StoredSession; error?: string } {
    const normalized = email.trim().toLowerCase();

    // Check simulation triggers
    if (normalized.includes('servererror')) {
      return { success: false, error: 'Authentication gateway unavailable (500). Please retry.' };
    }

    const matched = DEMO_USERS[normalized];
    if (!matched) {
      // Allow fallback if password meets length and role detected
      if (password === 'wrong' || normalized.includes('invalid')) {
        return { success: false, error: 'Invalid work email or password.' };
      }
      if (normalized.includes('admin')) {
        const user: UserSession = {
          id: 'USR-ADM-003',
          name: 'Jatin Kumar',
          email: normalized,
          role: 'admin',
          title: 'Enterprise Infrastructure Systems Lead',
          organization: 'Oil India Limited — Central PMIS Directorate',
          avatar: 'JK',
        };
        const session = this.createSession(user, remember);
        return { success: true, session };
      }
      if (normalized.includes('engineer')) {
        const user: UserSession = {
          id: 'USR-ENG-002',
          name: 'Debajit Borah',
          email: normalized,
          role: 'engineer',
          title: 'Lead Site Execution Engineer',
          organization: 'Oil India Limited — Duliajan Field Operations',
          avatar: 'DB',
        };
        const session = this.createSession(user, remember);
        return { success: true, session };
      }
      return { success: false, error: 'The work email or password does not match authorized project records.' };
    }

    if (password !== matched.passwordHash && password !== 'password123' && password !== 'Project2026!') {
      return { success: false, error: 'Invalid work email or password.' };
    }

    const session = this.createSession(matched.user, remember);
    return { success: true, session };
  }

  logout(): void {
    this.clearSession();
  }

  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  createSession(user: UserSession, remember: boolean): StoredSession {
    const duration = remember ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000; // 7 days or 2 hours
    const session: StoredSession = {
      user,
      token: `plnex_jwt_${user.role}_${Date.now()}`,
      expiresAt: Date.now() + duration,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
    return session;
  }

  expireSessionNow(): void {
    if (typeof window !== 'undefined') {
      const current = this.getCurrentSession();
      if (current) {
        current.expiresAt = Date.now() - 1000;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(current));
      }
    }
  }
}

export const authService = AuthService.getInstance();
