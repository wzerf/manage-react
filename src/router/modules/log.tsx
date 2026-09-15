import type { AppRouteObject } from '@/core/router/types';
import { createLazyRoute } from '@/core/router';

/**
 * 日志审计：与 Vue `router/routes/modules/log.ts` 对齐。
 * 侧栏单菜单进入 /log，页内 Tab 切换登录日志 / API 日志。
 */
export const logRoutes: AppRouteObject[] = [
  {
    name: 'Log',
    path: '/log',
    element: createLazyRoute(() => import('@/pages/app/log')),
    meta: {
      title: 'routes:log',
      icon: 'lucide:logs',
      order: 2004,
      fullPathKey: false,
    },
  },
];

export default logRoutes;
