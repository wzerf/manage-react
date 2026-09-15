import {mapTree} from "@/utils";
import type {AppRoute} from "@/core/router/types";

/**
 * 自动注入重定向 — 对齐 Vue `accessible.ts` 的 generateRoutes 后处理。
 * 规则：父路由有子路由且未配置 redirect 时，拼接 `route.path/首子path`；
 *       绝对路径或动态参数子路由不注入，避免出现字面量 `:id`。
 */
export const injectRedirects = (routes: AppRoute[]): AppRoute[] => {
    return mapTree(routes, (route, parent) => {
        if (route.redirect || !route.children?.length) {
            return route;
        }

        const firstChild = route.children[0] as AppRoute | undefined;

        if (!firstChild?.path || firstChild.path.startsWith('/')) {
            return route;
        }

        if (firstChild.path.startsWith(':')) {
            return route;
        }

        if (parent && typeof (parent as AppRoute).redirect === 'string' && (parent as AppRoute).redirect) {
            const parentRedirect = (parent as AppRoute).redirect as string;
            const parts = parentRedirect.split('/');
            parts.splice(-1, 2, route.path, firstChild.path);
            return {
                ...route,
                redirect: parts.join('/'),
            };
        }

        if (parent && (parent as AppRoute).redirect) {
            return {
                ...route,
                redirect: `${(parent as AppRoute).path}/${route.path}/${firstChild.path}`,
            };
        }

        return {
            ...route,
            redirect: `${route.path}/${firstChild.path}`,
        };
    });
};
