import { create } from 'zustand';

import type { AppRouteObject } from '@/core/router/types';

/**
 * Bumps when menus/roles change so AppRouter rebuilds accessible routes.
 * Not persisted — in-session only.
 */
interface AccessRefreshState {
  version: number;
  /**
   * 最终可访问路由树（对齐 Vue accessStore.accessRoutes）。
   * 侧栏菜单唯一来源：后端模式下即 /menu/all 投影结果，
   * 不回退到前端静态全集，保证「后端不下发就不显示」。
   */
  accessRoutes: AppRouteObject[];
  /** Invalidate runtime menus/routes (re-fetch /menu/all + rebuild router). */
  refreshAccess: () => void;
  setAccessRoutes: (routes: AppRouteObject[]) => void;
}

export const useAccessRefreshStore = create<AccessRefreshState>((set) => ({
  version: 0,
  accessRoutes: [],
  refreshAccess: () => set((s) => ({ version: s.version + 1 })),
  setAccessRoutes: (routes) => set({ accessRoutes: routes }),
}));
