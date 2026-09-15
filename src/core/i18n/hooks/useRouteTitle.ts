import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { translateRouteTitle } from '../utils/route-title';

/**
 * 返回随语言切换自动更新的路由/菜单标题翻译函数。
 * 标题来源见 {@link translateRouteTitle}。
 *
 * `t` 由 react-i18next 的 getFixedT 生成，语言切换时引用会变化，
 * 因此以 `t` 作为依赖即可驱动重新翻译。
 */
export const useRouteTitle = () => {
  const { t } = useTranslation();

  return useCallback((label?: string) => translateRouteTitle(t, label), [t]);
};
