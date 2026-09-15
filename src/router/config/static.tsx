import { Navigate } from 'react-router-dom';

import { type AppRouteObject } from '@/core/router';
import { AuthGuard } from '@/router/guards';
import MainLayout from '@/layouts/MainLayout';

/**
 * 静态基础路由配置
 */
export const staticRoutes: AppRouteObject[] = [
  // 主布局容器（所有需要登录的页面都在这里）
  // 直接使用 '/' 作为路径，业务路由会作为其子路由
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    meta: {
      hideInMenu: true,
      hideInTab: true,
    },
    children: [
      {
        path: '/',
        index: true,
        element: <Navigate to="/dashboard/analytics" replace />,
        meta: { title: 'routes:home', hideInMenu: true, hideInTab: true },
      },
    ],
  },
];
