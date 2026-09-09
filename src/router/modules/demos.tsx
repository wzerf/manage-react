import type { AppRouteObject } from '@/core/router/types';
import { createLazyRoute } from '@/core/router';

export const demosRoutes: AppRouteObject[] = [
  {
    name: 'demos',
    path: 'demos',
    meta: { title: 'routes:demos', icon: 'ic:baseline-view-in-ar', order: 1000, keepAlive: true },
    children: [
      {
        name: 'antd',
        path: 'antd',
        element: createLazyRoute(() => import('@/pages/app/demos')),
        meta: { title: 'routes:antd' },
      },
    ],
  },
];

export default demosRoutes;
