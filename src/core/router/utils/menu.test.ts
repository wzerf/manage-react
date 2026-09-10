import { describe, expect, it } from 'vitest';

import type { AppRouteObject } from '@/core/router/types';
import { transformRoutesToMenu } from './menu';

/**
 * 对齐 Vue 前端权限模式：业务菜单不依赖 /auth/codes。
 * 回归：无 authority 的系统/日志/任务应出现在侧栏。
 */
describe('transformRoutesToMenu frontend business menus', () => {
  const routes: AppRouteObject[] = [
    {
      name: 'dashboard',
      path: 'dashboard',
      meta: { title: 'routes:dashboard', order: -1 },
    },
    {
      name: 'task',
      path: 'task',
      meta: { title: 'routes:task', order: 2003 },
    },
    {
      name: 'log',
      path: 'log',
      meta: { title: 'routes:log', order: 2004 },
    },
    {
      name: 'system',
      path: 'system',
      meta: { title: 'routes:system', order: 2005 },
      children: [
        {
          name: 'systemUser',
          path: 'user',
          meta: { title: 'routes:systemUser' },
        },
      ],
    },
  ];

  it('shows system/log/task with empty permission codes', () => {
    const menus = transformRoutesToMenu(routes, []) ?? [];
    const paths = menus.map((m: { path?: string }) => m?.path);
    expect(paths).toEqual(
      expect.arrayContaining(['/dashboard', '/task', '/log', '/system']),
    );
  });

  it('hides routes that declare unmatched authority', () => {
    const gated: AppRouteObject[] = [
      {
        name: 'task',
        path: 'task',
        meta: { title: 'routes:task', authority: ['task:config:list'] },
      },
    ];
    const menus = transformRoutesToMenu(gated, []) ?? [];
    expect(menus.map((m: { path?: string }) => m?.path)).not.toContain('/task');
  });
});
