import type { AppRouteObject } from '@/core/router/types';
import { createLazyRoute } from '@/core/router';

/**
 * 任务调度：侧栏一级菜单，点击直接进入 /task，页内 Tab 切换任务配置 / 执行记录。
 */
export const taskRoutes: AppRouteObject[] = [
  {
    name: 'Task',
    path: '/task',
    element: createLazyRoute(() => import('@/pages/app/task')),
    meta: {
      title: 'routes:task',
      icon: 'lucide:timer',
      order: 2003,
      keepAlive: true,
      fullPathKey: false,
    },
  },
];

export default taskRoutes;
