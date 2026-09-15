import i18n from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';

import { initI18n } from '../config/i18n';
import { translateRouteTitle } from './route-title';

type Locale = 'zh-CN' | 'en-US';

const translate = (label?: string, lng: Locale = 'zh-CN') =>
  translateRouteTitle(i18n.getFixedT(lng), label);

/** 后端 sys_menu.name / /menu/all 下发 meta.title 的全部取值 */
const backendTitleKeys = [
  'page.dashboard.title',
  'page.dashboard.analytics',
  'page.dashboard.workspace',
  'system.title',
  'system.user.title',
  'system.role.title',
  'system.dict.title',
  'system.i18n.title',
  'system.menu.title',
  'system.api.title',
  'system.blacklist.title',
  'log.title',
  'task.title',
] as const;

describe('translateRouteTitle', () => {
  beforeAll(async () => {
    await initI18n('zh-CN');
  });

  it('解析后端下发的点号 key（首段即命名空间）', () => {
    expect(translate('page.dashboard.title')).toBe('仪表盘');
    expect(translate('system.title')).toBe('系统管理');
    expect(translate('system.user.title')).toBe('用户管理');
    expect(translate('log.title')).toBe('日志审计');
    expect(translate('task.title')).toBe('任务调度');
  });

  it('解析带命名空间前缀的前端静态路由 key', () => {
    expect(translate('routes:systemUser')).toBe('用户管理');
    expect(translate('routes:dashboard')).toBe('仪表盘');
  });

  it('未命中的 key、普通文本与空值原样返回', () => {
    expect(translate('system.unknown.title')).toBe('system.unknown.title');
    expect(translate('数据看板')).toBe('数据看板');
    expect(translate('')).toBe('');
    expect(translate(undefined)).toBe('');
  });

  it('后端下发的菜单 key 在中英文下都有翻译', () => {
    for (const key of backendTitleKeys) {
      expect(translate(key)).not.toBe(key);
      expect(translate(key, 'en-US')).not.toBe(key);
    }
  });

  it('切换语言后返回对应语言的文案', () => {
    expect(translate('system.user.title', 'en-US')).toBe('User Management');
    expect(translate('log.title', 'en-US')).toBe('Log Audit');
  });
});
