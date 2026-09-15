import type { AppRouteObject } from '@/core/router/types';
import { createLazyRoute } from '@/core/router';

export const dashboardRoutes: AppRouteObject[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    meta: {
      title: 'routes:dashboard',
      icon: 'lucide:layout-dashboard',
      order: -1,
    },
    children: [
      {
        name: 'Analytics',
        path: 'analytics',
        element: createLazyRoute(() => import('@/pages/app/dashboard/analytics')),
        meta: { title: 'routes:analytics', icon: 'lucide:area-chart', affixTab: true, order: 1 },
      },
      {
        name: 'Workspace',
        path: 'workspace',
        element: createLazyRoute(() => import('@/pages/app/dashboard/workspace')),
        meta: { title: 'routes:workspace', icon: 'carbon:workspace', order: 2 },
      },
    ],
  },
];

export default dashboardRoutes;
