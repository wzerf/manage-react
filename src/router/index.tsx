import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { createAccessibleRouter } from '@/core/router/factory';
import { useAccessRefreshStore, useAuthStore } from '@/stores';
import { useAuth } from '@/hooks/useAuth';
import { getAccessStatic } from '@/core/access';
import { fetchAllDictEntries } from '@/hooks/useDictCache';
import { usePreferencesStore } from '@/core/preferences/store';
import { getAllMenusApi } from '@/api/rest/menu';
import { useI18n } from '@/core/i18n';
import { appMessage as message } from '@/utils/app-message';
import { loadAccessMenusCache, saveAccessMenusCache } from '@/utils/menu-cache';

import { Forbidden } from '@/pages/core/error';
import type { AppRouteObject, BackendRoute, ComponentRecordType } from '@/core/router';
import MainLayout from '@/layouts/MainLayout';
import { AuthGuard } from '@/router/guards';

import { errorRoutes } from './config/error-routes';
import Loading from '@/components/common/Loading';
import { authRoutes } from './config/auth';
import { staticRoutes } from './config/static';

// 布局组件映射（后端 component 字段 → React 组件）
// 后端模式：BasicLayout 需要包裹 AuthGuard（前端模式已在 staticRoutes 中包裹）
const AuthenticatedLayout = () => (
  <AuthGuard>
    <MainLayout />
  </AuthGuard>
);

const layoutMap: ComponentRecordType = {
  BasicLayout: AuthenticatedLayout,
};

// 页面组件映射：使用 Vite glob 导入所有业务页面（后端模式用）
// 后端返回的 component 路径如 "dashboard/index"，会被标准化后匹配
const rawPageModules = import.meta.glob('../pages/app/**/*.tsx', { eager: true });

// 将 glob 返回的模块对象转换为 ComponentType 映射
// glob eager 返回 { '../pages/app/dashboard/index.tsx': { default: Component } }
//
// 关键：pageMap 的键必须与 generate-routes-backend.ts 中 normalizeViewPath 处理后端
// component 后的结果一致。后端 component 如 "dashboard/index" → "/dashboard/index"
// 所以 pageMap 键也应该是 "/dashboard" 格式（去掉 /pages/app 前缀）
const pageMap: ComponentRecordType = {};
for (const [globPath, module] of Object.entries(rawPageModules)) {
  const mod = module as any;
  const Component = mod?.default || mod;
  if (typeof Component !== 'function') continue;
  const appMatch = globPath.match(/(?:pages|views)\/app\/(.+)/);
  if (!appMatch) continue;
  const relativePath = appMatch[1].replace(/\.tsx$/, '').replace(/\/index$/, '');
  const normalizedKey = `/${relativePath}`;
  pageMap[normalizedKey] = Component;
  pageMap[`${normalizedKey}/index`] = Component;
  pageMap[`${normalizedKey}.tsx`] = Component;
  pageMap[`${normalizedKey}/index.tsx`] = Component;
  const withVueSuffix = `${normalizedKey}.vue`;
  pageMap[withVueSuffix] = Component;
  const withIndexVue = `${normalizedKey}/index.vue`;
  pageMap[withIndexVue] = Component;
  if (relativePath.includes('/')) {
    const lastSeg = relativePath.split('/').pop()!;
    if (lastSeg === 'index') continue;
  }
}
const coreFallbackModules = import.meta.glob('../pages/core/error/*.tsx', { eager: true });
for (const [globPath, module] of Object.entries(coreFallbackModules)) {
  const mod = module as any;
  const Component = mod?.default || mod;
  if (typeof Component !== 'function') continue;
  if (globPath.includes('/404.tsx')) {
    pageMap['/_core/fallback/not-found'] = Component;
    pageMap['/_core/fallback/not-found.vue'] = Component;
    pageMap['/_core/fallback/not-found.tsx'] = Component;
  }
  if (globPath.includes('/403.tsx')) {
    pageMap['/_core/fallback/forbidden'] = Component;
    pageMap['/_core/fallback/forbidden.vue'] = Component;
    pageMap['/_core/fallback/forbidden.tsx'] = Component;
  }
}

// 自动导入 modules 下的所有路由模块（仅包含业务功能路由）
const modulesRoutes = import.meta.glob<AppRouteObject[][]>('./modules/**/*.tsx', {
  eager: true, // 同步加载，确保路由立即生效
});

// 提取并展平所有模块路由（这些都是相对路径的业务路由）
const businessRoutes: AppRouteObject[] = Object.values(modulesRoutes).flatMap((module) => {
  // 模块可能导出 default 或具名导出 (如 dashboardRoutes)
  const routes = (module as any).default || Object.values(module)[0];
  return Array.isArray(routes) ? routes : [];
});

// 合并路由：将业务模块路由合并到主布局容器的 children 中
export const allRoutes: AppRouteObject[] = [
  ...staticRoutes.map((route) => {
    // 找到主布局容器路由（path 为 '/' 且包含 children）
    if (route.path === '/' && route.children) {
      return {
        ...route,
        children: [...route.children, ...businessRoutes],
      };
    }
    return route;
  }),
  ...authRoutes, // 认证路由（独立，不受 AuthGuard 保护）
  ...errorRoutes, // 错误路由放在最后
];

export const AppRouter = () => {
  const [router, setRouter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { accessToken } = useAuthStore();
  const accessMode = usePreferencesStore((s) => s.preferences.app.accessMode);
  const { t } = useI18n('common');

  const isAuthenticated = !!accessToken;

  useEffect(() => {
    let stale = false;

    const initRouter = async () => {
      setLoading(true);

      try {
        // ========== 已认证时的初始化流程 ==========
        // 对齐 Vue 版 setupAccessGuard：权限码获取 + 字典预加载
        if (isAuthenticated) {
          try {
            const auth = useAuth();

            // 1. 获取用户权限码（角色 + 权限码，首次会调 API）
            await auth.getUserPermissionCodes();

            // 2. 预加载字典数据（部分页面依赖字典，未预加载会导致闪烁）
            await fetchAllDictEntries();
          } catch (authErr) {
            // 认证失败（token 过期/无效）：forceLogout 已在拦截器中被调用
            // 清除 userStore 防止脏数据
            console.warn('Auth initialization failed, will redirect to login:', authErr);
            // forceLogout 已在拦截器中处理，此处清除 userStore
            const { useUserStore } = await import('@/stores');
            useUserStore.getState().$reset();

            if (stale) return; // 已过期，不继续创建路由
          }
        }

        const freshPermissions = getAccessStatic().getAllPermissions();
        const isAuthed = !!useAuthStore.getState().accessToken;

        const effectiveMode =
          !isAuthed && (accessMode === 'backend' || accessMode === 'mixed')
            ? ('frontend' as const)
            : accessMode;

        const appRouter = await createAccessibleRouter(effectiveMode, {
          routes: allRoutes,
          permissions: freshPermissions,
          forbiddenElement: <Forbidden />,
          fetchMenuListAsync: async () => {
            const token = useAuthStore.getState().accessToken;
            if (!token) return [];
            try {
              const menus = await getAllMenusApi();
              const list = (menus ?? []) as BackendRoute[];
              saveAccessMenusCache(token, list);
              return list;
            } catch (error: unknown) {
              const status = (error as { response?: { status?: number }; status?: number })?.response?.status ?? (error as { status?: number })?.status;
              if (status === 401) return [];
              const cached = loadAccessMenusCache<BackendRoute>(token);
              if (cached) {
                message.warning('菜单加载失败，已使用本地缓存');
                return cached;
              }
              throw error;
            }
          },
          layoutMap,
          pageMap,
          autoInjectRedirect: true,
          autoSort: true,
          onRoutesGenerated: (generated) => {
            useAccessRefreshStore.getState().setAccessRoutes(generated);
          },
        });

        if (!stale) {
          setRouter(appRouter);
        }
      } catch (err) {
        console.error('Router init failed:', err);
      } finally {
        if (!stale) {
          setLoading(false);
        }
      }
    };

    initRouter();

    // cleanup：当 effect 重新触发时（isAuthenticated 变化），取消上一次 initRouter
    return () => {
      stale = true;
    };
  }, [isAuthenticated, accessMode]);

  if (loading || !router)
    return <Loading fullScreen text={t('loading.initializing')} subText={t('loading.loadingRouter')} />;

  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
};
