import { Navigate } from 'react-router-dom';

import type { AppRouteObject } from '@/core/router/types';
import { createLazyRoute } from '@/core/router';

/**
 * 系统管理：与 Vue `router/routes/modules/system.ts` 对齐。
 * 前端权限模式下无 meta.authority，登录后即可出现在侧栏；页内按钮再按权限码显隐。
 */
export const systemRoutes: AppRouteObject[] = [
  {
    name: 'system',
    path: 'system',
    meta: {
      title: 'routes:system',
      icon: 'lucide:settings',
      order: 2005,
    },
    children: [
      {
        name: 'systemIndex',
        index: true,
        element: <Navigate to="user" replace />,
        meta: { hideInMenu: true, hideInTab: true },
      },
      {
        name: 'systemUser',
        path: 'user',
        element: createLazyRoute(() => import('@/pages/app/system/user')),
        meta: {
          title: 'routes:systemUser',
          icon: 'lucide:user-cog',
          order: 1,
        },
      },
      {
        name: 'systemRole',
        path: 'role',
        element: createLazyRoute(() => import('@/pages/app/system/role')),
        meta: {
          title: 'routes:systemRole',
          icon: 'lucide:shield-user',
          order: 2,
        },
      },
      {
        name: 'systemDict',
        path: 'dict',
        element: createLazyRoute(() => import('@/pages/app/system/dict')),
        meta: {
          title: 'routes:systemDict',
          icon: 'lucide:book-marked',
          order: 3,
        },
      },
      {
        name: 'systemI18n',
        path: 'i18n',
        element: createLazyRoute(() => import('@/pages/app/system/i18n')),
        meta: {
          title: 'routes:systemI18n',
          icon: 'lucide:languages',
          order: 4,
        },
      },
      {
        name: 'systemMenu',
        path: 'menu',
        element: createLazyRoute(() => import('@/pages/app/system/menu')),
        meta: {
          title: 'routes:systemMenu',
          icon: 'lucide:menu',
          order: 5,
        },
      },
      {
        name: 'systemApi',
        path: 'api',
        element: createLazyRoute(() => import('@/pages/app/system/api')),
        meta: {
          title: 'routes:systemApi',
          icon: 'lucide:terminal',
          order: 6,
        },
      },
      {
        name: 'systemBlacklist',
        path: 'blacklist',
        element: createLazyRoute(() => import('@/pages/app/system/blacklist')),
        meta: {
          title: 'routes:systemBlacklist',
          icon: 'lucide:shield-ban',
          order: 7,
        },
      },
    ],
  },
];

export default systemRoutes;
