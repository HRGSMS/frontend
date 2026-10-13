import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { authClient, type Session } from '../lib/auth-client';
import { authenticate, endSession, readSession } from '../lib/auth-session';

import { AuthContext } from './auth-state';

const AUTH_CHANGE = 'hrgms:auth-change';
const ACTIVITY = 'hrgms:activity';
const IDLE_MS = 15 * 60 * 1000;
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Authentication is unavailable. Please try again.';
function publish() {
  try {
    localStorage.setItem(AUTH_CHANGE, `${Date.now()}:${Math.random()}`);
  } catch {
    /* Storage may be disabled. */
  }
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const revision = useRef(0);
  const lastActivity = useRef(0);
  const busy = useRef(false);
  const locallyLocked = useRef(false);

  const refreshSession = useCallback(async () => {
    if (busy.current || locallyLocked.current) return;
    const current = ++revision.current;
    try {
      const next = await readSession(authClient);
      if (current !== revision.current) return;
      if (next && lastActivity.current === 0) lastActivity.current = Date.now();
      setData(next);
      setAuthError(null);
    } catch (error) {
      if (current !== revision.current) return;
      setData(null);
      setAuthError(message(error));
    } finally {
      if (current === revision.current) setIsLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    busy.current = true;
    const current = ++revision.current;
    try {
      const next = await authenticate(authClient, email, password);
      if (current !== revision.current)
        return { error: new Error('Your session changed. Please try again.') };
      locallyLocked.current = false;
      lastActivity.current = Date.now();
      setData(next);
      setAuthError(null);
      publish();
      return {};
    } catch (error) {
      return { error: new Error(message(error)) };
    } finally {
      busy.current = false;
      setIsLoading(false);
    }
  };

  const signUpGuest = async (payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    password: string;
  }) => {
    try {
      const authBase =
        import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:4000/api/auth';
      const res = await fetch(`${authBase}/guest-sign-up`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to create guest account');
      }

      return await signIn(payload.email, payload.password);
    } catch (error) {
      return { error: new Error(message(error)) };
    }
  };

  const signOut = useCallback(async () => {
    busy.current = true;
    const current = ++revision.current;
    try {
      await endSession(authClient);
      if (current !== revision.current) return;
      locallyLocked.current = true;
      setData(null);
      setAuthError(null);
      publish();
    } catch (error) {
      if (current === revision.current) setAuthError(message(error));
      throw error;
    } finally {
      busy.current = false;
    }
  }, []);

  const invalidateRequests = useCallback(() => {
    ++revision.current;
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void refreshSession();
    });
    const onFocus = () => {
      void refreshSession();
    };
    const onExpired = () => {
      // A delayed response from an older API request must not cancel a new login/logout.
      if (busy.current) return;
      ++revision.current;
      setData(null);
      setAuthError(null);
      void refreshSession();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_CHANGE) {
        locallyLocked.current = false;
        lastActivity.current = Date.now();
        setData(null);
        void refreshSession();
      }
      if (event.key === ACTIVITY && event.newValue)
        lastActivity.current = Math.max(lastActivity.current, Number(event.newValue) || 0);
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    window.addEventListener('hrgms:session-expired', onExpired);
    const poll = window.setInterval(onFocus, 60000);
    return () => {
      active = false;
      invalidateRequests();
      window.clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hrgms:session-expired', onExpired);
    };
  }, [refreshSession, invalidateRequests]);

  useEffect(() => {
    if (!data) return;
    let lastPublished = 0;
    let ending = false;
    const onActivity = () => {
      lastActivity.current = Date.now();
      if (Date.now() - lastPublished > 5000) {
        lastPublished = Date.now();
        try {
          localStorage.setItem(ACTIVITY, String(lastActivity.current));
        } catch {
          /* Optional activity sync. */
        }
      }
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((event) => window.addEventListener(event, onActivity, { passive: true }));
    const interval = window.setInterval(() => {
      if (new Date(data.session.expiresAt).getTime() <= Date.now()) {
        locallyLocked.current = true;
        ++revision.current;
        setData(null);
      } else if (!ending && Date.now() - lastActivity.current >= IDLE_MS) {
        ending = true;
        locallyLocked.current = true;
        ++revision.current;
        setData(null);
        void signOut().catch(() => undefined);
      }
    }, 1000);
    return () => {
      window.clearInterval(interval);
      events.forEach((event) => window.removeEventListener(event, onActivity));
    };
  }, [data, signOut]);

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        session: data?.session ?? null,
        isLoading,
        isAuthenticated: !!data,
        authError,
        signIn,
        signUpGuest,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
