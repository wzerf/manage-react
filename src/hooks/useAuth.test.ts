import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/rest/auth', () => ({
  getAccessCodesApi: vi.fn(),
}));

vi.mock('@/api/hooks', () => ({
  fetchUserProfile: vi.fn(),
  fetchGenerateCaptcha: vi.fn(),
}));

import { getAccessCodesApi } from '@/api/rest/auth';
import { useUserStore } from '@/stores/user';
import { useAuth } from './useAuth';

describe('getUserPermissionCodes', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    });
    useUserStore.getState().$reset();
    vi.mocked(getAccessCodesApi).mockReset();
  });

  it('fetches GET /auth/codes even when roles already exist', async () => {
    useUserStore.getState().setUserInfo({
      id: 1,
      username: 'root',
      avatar: '',
      nickname: 'Root',
      realname: 'Root',
      tenantId: 0,
      roles: ['root'],
    });
    useUserStore.getState().setUserRoles(['root']);
    vi.mocked(getAccessCodesApi).mockResolvedValue(['task:config:list', 'log:login-log:list']);

    const result = await useAuth().getUserPermissionCodes();

    expect(getAccessCodesApi).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      roles: ['root'],
      codes: ['task:config:list', 'log:login-log:list'],
    });
    expect(useUserStore.getState().accessCodes).toEqual([
      'task:config:list',
      'log:login-log:list',
    ]);
  });

  it('does not refetch codes when already cached', async () => {
    useUserStore.getState().setUserInfo({
      id: 1,
      username: 'root',
      avatar: '',
      nickname: 'Root',
      realname: 'Root',
      tenantId: 0,
      roles: ['root'],
    });
    useUserStore.getState().setAccessCodes(['task:config:list']);

    const result = await useAuth().getUserPermissionCodes();

    expect(getAccessCodesApi).not.toHaveBeenCalled();
    expect(result).toEqual({ roles: ['root'], codes: ['task:config:list'] });
  });
});
