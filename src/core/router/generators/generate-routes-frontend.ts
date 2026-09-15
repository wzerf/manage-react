import type {ReactNode} from "react";

import {filterTree, mapTree} from "@/utils";
import type {AppRouteObject, RouteMeta} from "@/core/router/types";

/**
 * 动态生成路由 - 前端权限过滤方式
 * @param routes - 静态路由表（AppRouteObject[]，含 meta）
 * @param permissions - 用户权限码列表
 * @param forbiddenElement - 无权限时渲染的元素（<Forbidden />）
 */
export async function generateRoutesByFrontend(
    routes: AppRouteObject[],
    permissions: string[],
    forbiddenElement?: ReactNode
): Promise<AppRouteObject[]> {
    const filteredRoutes = filterTree(routes, (route) => hasPermission(route, permissions));

    if (!forbiddenElement) {
        return filteredRoutes;
    }

    return mapTree(filteredRoutes, (route) => {
        if (menuHasVisibleWithForbidden(route as AppRouteObject)) {
            return {
                ...route,
                element: forbiddenElement,
            };
        }
        return route;
    });
}

function hasPermission(route: AppRouteObject, permissions: string[]): boolean {
    const meta = route.meta as RouteMeta | undefined;
    const authority = meta?.authority;
    if (!authority?.length) {
        return true;
    }
    const canAccess = authority.some((code) => permissions.includes(code));
    return canAccess || (!canAccess && menuHasVisibleWithForbidden(route));
}

function menuHasVisibleWithForbidden(route: AppRouteObject): boolean {
    const meta = route.meta as Record<string, unknown> | undefined;
    return !!meta?.authority && Reflect.has((meta ?? {}) as object, 'menuVisibleWithForbidden') && !!(meta as RouteMeta)?.menuVisibleWithForbidden;
}

export {hasPermission, menuHasVisibleWithForbidden};
export const shouldRenderForbidden = menuHasVisibleWithForbidden;
