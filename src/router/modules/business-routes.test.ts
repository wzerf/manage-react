import { describe, expect, it } from 'vitest';

import { logRoutes } from './log';
import { systemRoutes } from './system';
import { taskRoutes } from './task';

function collectNames(routes: { name?: string; children?: unknown[] }[]): string[] {
  const names: string[] = [];
  for (const route of routes) {
    if (route.name) names.push(route.name);
    if (Array.isArray(route.children)) {
      names.push(...collectNames(route.children as { name?: string; children?: unknown[] }[]));
    }
  }
  return names;
}

describe('frontend business route modules', () => {
  it('registers system pages aligned with Vue', () => {
    const names = collectNames(systemRoutes);
    expect(names).toEqual(
      expect.arrayContaining([
        'System',
        'SystemUser',
        'SystemRole',
        'SystemDict',
        'SystemI18n',
        'SystemMenu',
        'SystemApi',
        'SystemBlacklist',
      ]),
    );
    expect(systemRoutes[0]?.meta?.authority).toBeUndefined();
  });

  it('registers log and task as ungated sidebar entries', () => {
    expect(logRoutes[0]?.name).toBe('Log');
    expect(logRoutes[0]?.meta?.authority).toBeUndefined();
    expect(taskRoutes[0]?.name).toBe('Task');
    expect(taskRoutes[0]?.meta?.authority).toBeUndefined();
  });

  it('does not register demo routes', () => {
    const modules = import.meta.glob('./*.tsx', { eager: true });
    expect(Object.keys(modules).some((key) => key.includes('demos'))).toBe(false);
  });
});
