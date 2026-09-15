import React, { useEffect, useMemo } from 'react';
import { usePreferencesStore } from '@/core/preferences/store';
import { useI18n, useRouteTitle } from '@/core/i18n';

interface UsePageTitleOptions {
  /** 手动传入的标题（优先级最高） */
  manual?: React.ReactNode;

  /** 路由对象中的标题 */
  routeTitle?: string;

  /** 默认标题（兜底） */
  defaultTitle?: string;

  /** 是否更新浏览器标签页标题 */
  updateDocumentTitle?: boolean;
}

export const usePageTitle = ({
  manual,
  routeTitle,
  defaultTitle,
  updateDocumentTitle = true,
}: UsePageTitleOptions): React.ReactNode => {
  const { app } = usePreferencesStore((state) => state.preferences);
  const { t } = useI18n('common');
  const translateTitle = useRouteTitle();
  const resolvedDefaultTitle = defaultTitle ?? t('pageContainer.defaultTitle');

  // 计算最终标题（包含翻译）
  const title = useMemo(() => {
    if (manual) return manual;
    if (routeTitle) {
      // 如果 routeTitle 是 i18n key，进行翻译
      return translateTitle(routeTitle);
    }
    return resolvedDefaultTitle;
  }, [manual, routeTitle, resolvedDefaultTitle, translateTitle]);

  // 更新 document.title（配合 preferences.app.dynamicTitle）
  useEffect(() => {
    if (!updateDocumentTitle || !app.dynamicTitle) return;

    const originalTitle = document.title;
    const appName = app.name || t('app.defaultName');

    if (title && typeof title === 'string') {
      document.title = `${title} - ${appName}`;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [title, app.name, app.dynamicTitle, updateDocumentTitle, t]);

  return title;
};
