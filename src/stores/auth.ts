import { create } from 'zustand';
import i18next from 'i18next';

import { loginApi, getUserInfoApi, getAccessCodesApi, logoutApi } from '@/api/rest/auth';
import type { UserInfo, LoginRequest } from '@/api/rest/types';
import { queryClient } from '@/core/query-client';
import {
  clearCachedPublicKey,
  prepareGlobalPublicKey,
  setCachedPublicKey,
} from '@/core/transport/rest/security';
import { clearAccessMenusCache } from '@/utils/menu-cache';

const STORAGE_KEY = 'auth-storage';
const REMEMBER_KEY = 'auth-remember';
const USER_INFO_KEY = 'auth-user-info';

export interface LoginOptions {
  remember?: boolean;
}

export interface AuthState {
  accessToken: string | null;
  userInfo: UserInfo | null;
  loginLoading: boolean;
  error: string | null;
  login: (
    params: LoginRequest,
    options?: LoginOptions,
    onSuccess?: () => void,
  ) => Promise<void>;
  logout: (redirect?: boolean) => Promise<void>;
  reauthenticate: () => void;
  forceLogout: () => void;
  setUserInfo: (info: UserInfo) => void;
  clearError: () => void;
  $reset: () => void;
  hydrate: () => void;
}

function pickStorage(remember: boolean): Storage | null {
  if (typeof window === 'undefined') return null;
  return remember ? window.localStorage : window.sessionStorage;
}

function getRememberFromCookie(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(REMEMBER_KEY) !== '0';
}

function persistState(
  state: Pick<AuthState, 'accessToken'>,
  remember: boolean,
) {
  if (typeof window === 'undefined') return;
  const target = pickStorage(remember);
  const other = remember ? window.sessionStorage : window.localStorage;
  other.removeItem(STORAGE_KEY);
  if (target) {
    target.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  window.localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
}

function clearPersisted() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(REMEMBER_KEY);
  window.localStorage.removeItem(USER_INFO_KEY);
  window.sessionStorage.removeItem(USER_INFO_KEY);
}

function persistUserInfo(info: UserInfo) {
  if (typeof window === 'undefined') return;
  try {
    const remember = getRememberFromCookie();
    const target = remember ? window.localStorage : window.sessionStorage;
    const other = remember ? window.sessionStorage : window.localStorage;
    other.removeItem(USER_INFO_KEY);
    target.setItem(USER_INFO_KEY, JSON.stringify(info));
  } catch (err) {
    console.warn('[auth.persistUserInfo] failed', err);
  }
}

function readPersistedUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  const remember = getRememberFromCookie();
  const raw = (remember ? window.localStorage : window.sessionStorage).getItem(USER_INFO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

function readPersisted(): {
  accessToken: string | null;
} {
  if (typeof window === 'undefined') {
    return { accessToken: null };
  }
  const remember = getRememberFromCookie();
  const raw = pickStorage(remember)?.getItem(STORAGE_KEY);
  if (!raw) return { accessToken: null };
  try {
    const parsed = JSON.parse(raw) as {
      accessToken?: string;
    };
    return {
      accessToken: parsed.accessToken ?? null,
    };
  } catch {
    return { accessToken: null };
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  userInfo: null,
  loginLoading: false,
  error: null,

  hydrate: () => {
    const persisted = readPersisted();
    const userInfo = readPersistedUserInfo();
    set({ ...persisted, userInfo });
  },

  login: async (params, options = {}, onSuccess) => {
    const remember = options.remember ?? true;
    set({ loginLoading: true, error: null });

    try {
      await prepareGlobalPublicKey(import.meta.env.VITE_API_URL || '/api');

      const response = await loginApi(params);
      const accessToken = response.accessToken;

      set({ accessToken });
      persistState({ accessToken }, remember);
      if (response.publicKey) {
        setCachedPublicKey(response.publicKey);
      }

      // 对齐 Vue authLogin：token 落地后并行拉用户信息 + GET /auth/codes。
      // 任务调度/日志审计页按 BUTTON 码显隐 Tab，登录阶段不写入 accessCodes 会 403。
      const [infoResult, codesResult] = await Promise.allSettled([
        getUserInfoApi(),
        getAccessCodesApi(),
      ]);

      let userInfo: UserInfo | null = null;
      if (infoResult.status === 'fulfilled') {
        userInfo = infoResult.value;
      } else {
        console.warn('[auth.login] getUserInfo failed, fallback to login response', infoResult.reason);
        userInfo = {
          id: response.id,
          username: response.username,
          realName: response.realName,
          roles: response.roles,
          homePath: response.homePath,
        };
      }

      let accessCodes: string[] = [];
      if (codesResult.status === 'fulfilled' && Array.isArray(codesResult.value)) {
        accessCodes = codesResult.value;
      } else if (codesResult.status === 'rejected') {
        console.warn('[auth.login] getAccessCodes failed', codesResult.reason);
      }

      set({ userInfo });
      persistUserInfo(userInfo);
      try {
        const { useUserStore } = await import('@/stores/user');
        const us = useUserStore.getState();
        if (userInfo) us.setUserInfo(userInfo as unknown as BasicUserInfo);
        if (response.roles?.length) us.setUserRoles(response.roles);
        us.setAccessCodes(accessCodes);
      } catch {
        // ignore store sync failure
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : i18next.t('auth:loginFailed', { defaultValue: '登录失败' });
      set({ error: errorMsg });
      throw err;
    } finally {
      set({ loginLoading: false });
    }
  },

  logout: async () => {
    try {
      await logoutApi().catch(() => {
      });
    } finally {
      queryClient.clear();
      clearPersisted();
      clearAccessMenusCache();
      clearCachedPublicKey();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('user-storage');
      }
      try {
        const { useUserStore } = await import('@/stores/user');
        useUserStore.getState().$reset();
      } catch {
        // ignore
      }
      set({
        accessToken: null,
        userInfo: null,
        error: null,
        loginLoading: false,
      });
    }
  },

  reauthenticate: () => {
    set({ error: i18next.t('auth:sessionExpired', { defaultValue: '会话已过期' }) });
  },

  forceLogout: () => {
    queryClient.clear();
    clearPersisted();
    clearAccessMenusCache();
    clearCachedPublicKey();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('user-storage');
    }
    void import('@/stores/user').then(({ useUserStore }) => {
      useUserStore.getState().$reset();
    });
    set({
      accessToken: null,
      userInfo: null,
      error: null,
      loginLoading: false,
    });
  },

  setUserInfo: (info) => {
    set({ userInfo: info });
    if (info) persistUserInfo(info);
    else if (typeof window !== 'undefined') {
      window.localStorage.removeItem(USER_INFO_KEY);
    }
  },
  clearError: () => set({ error: null }),
  $reset: () =>
    set({
      accessToken: null,
      userInfo: null,
      error: null,
      loginLoading: false,
    }),
}));
