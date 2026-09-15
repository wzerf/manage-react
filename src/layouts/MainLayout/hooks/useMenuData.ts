import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { transformRoutesToMenu } from '@/core/router/utils/menu';
import { useAccessRefreshStore } from '@/stores';

interface UseMenuDataOptions {
  permissions: string[]; // 权限列表
}

/**
 * 侧栏菜单数据源 = 最终可访问路由树（对齐 Vue accessStore.accessRoutes）。
 *
 * 后端模式下该树来自 /menu/all 投影结果，因此**后端未下发的菜单不会显示**；
 * 不能回退到 allRoutes 前端静态全集，否则会出现「SQL 没有 Task 但侧栏仍有任务调度」。
 */
export const useMenuData = ({ permissions }: UseMenuDataOptions) => {
  // 使用 useTranslation 来监听语言变化
  const { i18n } = useTranslation();

  const accessRoutes = useAccessRefreshStore((state) => state.accessRoutes);

  // 取主布局容器（path: '/'）的子路由作为菜单数据
  const routes = useMemo(() => {
    const layoutRoute = accessRoutes.find((route) => route.path === '/' && route.children);
    return layoutRoute?.children ?? [];
  }, [accessRoutes]);

  // 转换路由 → 菜单
  // 关键：添加 i18n.language 作为依赖，语言切换时重新生成菜单
  return useMemo(() => {
    return transformRoutesToMenu(routes, permissions);
  }, [routes, permissions, i18n.language]);
};
