import type { AppRouteObject } from '@/core/router/types';
import { createLazyRoute } from '@/core/router';

export const dashboardRoutes: AppRouteObject[] = [
  {
    name: 'dashboard',
    path: 'dashboard',
    meta: {
      title: 'routes:dashboard',
      icon: 'lucide:layout-dashboard',
      order: -1,
    },
    children: [
      {
        name: 'analytics',
        path: 'analytics',
        element: createLazyRoute(() => import('@/pages/app/dashboard/analytics')),
        meta: { title: 'routes:analytics', icon: 'lucide:area-chart', affixTab: true },
      },
      {
        name: 'workspace',
        path: 'workspace',
        element: createLazyRoute(() => import('@/pages/app/dashboard/workspace')),
        meta: { title: 'routes:workspace', icon: 'carbon:workspace' },
      },
    ],
  },
];

export default dashboardRoutes;
