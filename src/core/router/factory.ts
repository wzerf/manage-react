import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { flattenLayoutAbsoluteChildren } from './utils/flatten-absolute-routes';
import { injectRedirects } from './utils/inject-redirect';
import { sortRoutes } from './utils/sort-routes';
import { transformRoutesWithHandle } from './utils/transform-meta-to-handle';
import type { GenerateMenuAndRoutesOptions, AppRoute, AppRouteObject } from './types';
import { generateRoutesByBackend, generateRoutesByFrontend } from '@/core/router/generators';
import type { AccessModeType } from '@/core/preferences';
import React from 'react';

function mergeRoutesByName(
  baseRoutes: AppRouteObject[],
  extraRoutes: AppRouteObject[],
): AppRouteObject[] {
  const result: AppRouteObject[] = [];
  const routeMap = new Map<string, AppRouteObject>();
  for (const route of baseRoutes) {
    const clone = { ...route } as AppRouteObject;
    result.push(clone);
    if (clone.name) routeMap.set(clone.name, clone);
  }
  for (const route of extraRoutes) {
    if (route.name && routeMap.has(route.name)) {
      const existing = routeMap.get(route.name)!;
      const existingChildren = (existing.children ?? []) as AppRouteObject[];
      const routeChildren = (route.children ?? []) as AppRouteObject[];
      const merged = {
        ...route,
        ...existing,
        meta: { ...(route.meta as object), ...(existing.meta as object) },
      } as AppRouteObject;
      if (existingChildren.length > 0 || routeChildren.length > 0) {
        merged.children = mergeRoutesByName(existingChildren, routeChildren);
      }
      Object.assign(existing, merged);
    } else {
      const clone = { ...route } as AppRouteObject;
      result.push(clone);
      if (clone.name) routeMap.set(clone.name, clone);
    }
  }
  return result;
}

/**
 * 从路由列表中分离出：
 * - layoutRoutes: 包含 MainLayout/AuthGuard 的根路由（path='/'）
 * - staticRoutes: 不受 AuthGuard 保护的静态路由（auth/login/error 等）
 */
function separateRoutes(routes: AppRouteObject[]) {
  const layoutRoutes: AppRouteObject[] = [];  // path='/' 的布局路由
  const otherRoutes: AppRouteObject[] = [];    // 其他静态路由（auth/error等）

  for (const route of routes) {
    if (route.path === '/' && route.children) {
      layoutRoutes.push(route);
    } else {
      otherRoutes.push(route);
    }
  }

  return { layoutRoutes, otherRoutes };
}

export const createAccessibleRouter = async (
  mode: AccessModeType,
  options: GenerateMenuAndRoutesOptions,
) => {
  let routes: AppRouteObject[] = [...options.routes];

  // 根据模式生成路由
  switch (mode) {
    case 'backend': {
      if (!options.fetchMenuListAsync) {
        console.warn('[Router] Backend mode requires fetchMenuListAsync, falling back to frontend mode');
        routes = await generateRoutesByFrontend(
          routes,
          options.permissions ?? [],
          options.forbiddenElement,
        );
      } else {
        // 分离布局路由与静态路由（auth/error 等不受 AuthGuard 保护）
        const { layoutRoutes, otherRoutes } = separateRoutes(routes);

        // 对齐 Vue generateAccessible：/menu/all 返回的是业务树，没有 BasicLayout 根。
        // 必须挂到 path='/' 的 MainLayout 下，否则登录后业务页没有侧栏。
        const backendRoutes = await generateRoutesByBackend({
          staticRoutes: layoutRoutes,
          mode,
          fetchMenuListAsync: options.fetchMenuListAsync,
          layoutMap: options.layoutMap,
          pageMap: options.pageMap,
          forbiddenElement: options.forbiddenElement,
        });

        const layout = layoutRoutes[0];
        if (layout) {
          const keepChildren = (layout.children ?? []).filter(
            (child) => child.index || child.meta?.hideInMenu,
          );
          routes = [
            { ...layout, children: [...keepChildren, ...backendRoutes] },
            ...otherRoutes,
          ];
        } else {
          routes = [...backendRoutes, ...otherRoutes];
        }
      }
      break;
    }
    case 'frontend':
    default: {
      routes = await generateRoutesByFrontend(
        routes,
        options.permissions ?? [],
        options.forbiddenElement,
      );
      break;
    }
    case 'mixed': {
      const frontendRoutes = await generateRoutesByFrontend(
        routes,
        options.permissions ?? [],
        options.forbiddenElement,
      );
      if (!options.fetchMenuListAsync) {
        routes = frontendRoutes;
        break;
      }
      const backendRoutes = await generateRoutesByBackend({
        staticRoutes: [],
        mode: 'backend' as AccessModeType,
        fetchMenuListAsync: options.fetchMenuListAsync,
        layoutMap: options.layoutMap,
        pageMap: options.pageMap,
        forbiddenElement: options.forbiddenElement,
      });
      const mergedBusiness = mergeRoutesByName(
        backendRoutes as AppRouteObject[],
        (separateRoutes(frontendRoutes).layoutRoutes[0]?.children ?? []).filter(
          (c) => !c.index && !(c.meta as any)?.hideInMenu,
        ) as AppRouteObject[],
      );
      const { layoutRoutes, otherRoutes } = separateRoutes(frontendRoutes);
      const layout = layoutRoutes[0];
      if (layout) {
        const keepChildren = (layout.children ?? []).filter(
          (child) => child.index || (child.meta as any)?.hideInMenu,
        );
        routes = [{ ...layout, children: [...keepChildren, ...mergedBusiness] }, ...otherRoutes];
      } else {
        routes = [...mergedBusiness, ...otherRoutes];
      }
      break;
    }
  }

  if (options.autoInjectRedirect !== false)
    routes = injectRedirects(routes as unknown as AppRoute[]) as unknown as AppRouteObject[];
  if (options.autoSort !== false)
    routes = sortRoutes(routes as unknown as AppRoute[]) as unknown as AppRouteObject[];

  routes = flattenLayoutAbsoluteChildren(routes);
  routes = transformRoutesWithHandle(routes);

  // 语义对齐 Vue generateAccessible：accessibleRoutes 即语义菜单来源，
  // 侧栏不得回退到前端静态全集（否则后端未下发的菜单仍会显示）。
  options.onRoutesGenerated?.(routes);

  return createBrowserRouter(routes as RouteObject[], {
    future: {
      v7_relativeSplatPath: true,
    },
  });
};

/**
 * 根据模式生成路由
 */
export async function generateRoutes(
  mode: AccessModeType,
  options: {
    routes: AppRouteObject[];
    permissions: string[];
    roles: string[];
    forbiddenElement?: React.ReactNode;
    fetchMenuListAsync?: () => Promise<any[]>;
    layoutMap?: Record<string, React.ComponentType<any>>;
    pageMap?: Record<string, React.ComponentType<any>>;
  },
): Promise<AppRouteObject[]> {
  const { routes, permissions, forbiddenElement, fetchMenuListAsync, layoutMap, pageMap } = options;

  let resultRoutes: AppRouteObject[] = routes;

  switch (mode) {
    case 'backend': {
      if (!fetchMenuListAsync) {
        throw new Error('Backend mode requires fetchMenuListAsync');
      }
      resultRoutes = await generateRoutesByBackend({
        staticRoutes: routes,
        mode,
        fetchMenuListAsync,
        layoutMap,
        pageMap,
      });
      break;
    }
    case 'frontend': {
      resultRoutes = await generateRoutesByFrontend(routes, permissions, forbiddenElement);
      break;
    }
    case 'mixed': {
      const frontendRoutes = await generateRoutesByFrontend(routes, permissions, forbiddenElement);
      if (!fetchMenuListAsync) {
        resultRoutes = frontendRoutes;
        break;
      }
      const backendRoutes = await generateRoutesByBackend({
        staticRoutes: [],
        mode: 'backend' as AccessModeType,
        fetchMenuListAsync,
        layoutMap,
        pageMap,
        forbiddenElement,
      });
      const mergedBusiness = mergeRoutesByName(
        backendRoutes as AppRouteObject[],
        (separateRoutes(frontendRoutes).layoutRoutes[0]?.children ?? []).filter(
          (c) => !c.index && !(c.meta as any)?.hideInMenu,
        ) as AppRouteObject[],
      );
      const { layoutRoutes, otherRoutes } = separateRoutes(frontendRoutes);
      const layout = layoutRoutes[0];
      if (layout) {
        const keepChildren = (layout.children ?? []).filter((c) => (c as any).index || (c as any).meta?.hideInMenu);
        resultRoutes = [{ ...layout, children: [...keepChildren, ...mergedBusiness] }, ...otherRoutes];
      } else {
        resultRoutes = [...mergedBusiness, ...otherRoutes];
      }
      break;
    }
  }

  return resultRoutes;
}
