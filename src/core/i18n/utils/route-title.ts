import type { TFunction } from 'i18next';

import { allNamespaces } from '@/locales';

/** 无命名空间前缀时的兜底查找顺序：前端静态路由标题 → 通用文案 */
const FALLBACK_NAMESPACES = ['routes', 'common'] as const;

const knownNamespaces = new Set<string>(allNamespaces);

const lookup = (t: TFunction, key: string, ns: string): string | undefined => {
  const translated = t(key, { ns, defaultValue: '' });
  return typeof translated === 'string' && translated ? translated : undefined;
};

/**
 * 把路由/菜单标题解析为可展示文案，支持三种写法：
 *
 * 1. 显式命名空间前缀：`routes:systemUser` → `t('systemUser', { ns: 'routes' })`
 * 2. 后端下发的点号 key：`system.user.title` → `t('user.title', { ns: 'system' })`
 *    （首段即命名空间，与 `utils/backend.ts` 的合并规则保持一致）
 * 3. 普通文本：依次尝试 routes / common，都未命中则原样返回
 */
export const translateRouteTitle = (t: TFunction, label?: string): string => {
  const raw = label?.trim() ?? '';
  if (!raw) return '';

  const colonIndex = raw.indexOf(':');
  if (colonIndex > 0) {
    const ns = raw.slice(0, colonIndex);
    if (knownNamespaces.has(ns)) {
      return lookup(t, raw.slice(colonIndex + 1), ns) ?? raw;
    }
  }

  const dotIndex = raw.indexOf('.');
  if (dotIndex > 0) {
    const ns = raw.slice(0, dotIndex);
    if (knownNamespaces.has(ns)) {
      const translated = lookup(t, raw.slice(dotIndex + 1), ns);
      if (translated) return translated;
    }
  }

  for (const ns of FALLBACK_NAMESPACES) {
    const translated = lookup(t, raw, ns);
    if (translated) return translated;
  }

  return raw;
};
