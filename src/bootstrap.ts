import { appMessage as message } from '@/utils/app-message';
import { initI18n } from '@/core/i18n';
import { fetchBackendI18n } from '@/core/i18n/utils';
import { usePreferencesStore } from '@/core/preferences';
import { type HttpResponse, RequestClient } from '@/core/transport/rest';
import i18n from 'i18next';
import { useAuthStore } from '@/stores';
import type { SupportedLocale } from '@/locales';

/**
 * 应用启动初始化
 */
export async function bootstrap() {
  const { resetAccessModeFromEnv } = await import('@/core/preferences/store');
  resetAccessModeFromEnv();
  useAuthStore.getState().hydrate();

  await _initI18n();

  console.log('✅ 应用启动初始化完成');
}

async function _initI18n() {
  const initialLocale = usePreferencesStore.getState().preferences.app
    .locale as SupportedLocale;

  await initI18n(initialLocale);

  RequestClient.init(import.meta.env.VITE_API_URL, {
    getToken: () => useAuthStore.getState().accessToken,
    getLocale: () => i18n.language,
    onReAuthenticate: async () => {
      useAuthStore.getState().forceLogout();
    },
    onError: (msg) => {
      if (msg) {
        message.error(msg);
      }
    },
    getErrorMsg: getErrorMsg,
  });

  fetchBackendI18n(initialLocale);
}

/**
 * 按优先级获取错误提示文本
 * 1. reason → i18n error.xxx
 * 2. reason 无翻译 → 使用 message
 * 3. 都无 → 使用 status → i18n status.xxx
 * 4. 都无 → fallback
 */
export function getErrorMsg(error: unknown) {
  const i18nPrefix = 'request.';

  const errStr = String(error ?? '');
  if (errStr.includes('Network Error')) {
    return i18n.t(i18nPrefix + 'error.networkError');
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    String(error.message).includes('timeout')
  ) {
    return i18n.t(i18nPrefix + 'error.timeout');
  }

  const rawData =
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
      ? (error.response.data as unknown)
      : undefined;

  let resData: HttpResponse | undefined;
  if (rawData && typeof rawData === 'object') {
    if ('response' in (rawData as Record<string, unknown>)) {
      const nested = (rawData as { response?: unknown }).response;
      if (nested && typeof nested === 'object' && 'data' in (nested as Record<string, unknown>)) {
        resData = (nested as { data: HttpResponse }).data as HttpResponse;
      }
    }
    if (!resData) resData = rawData as HttpResponse;
  }

  if (!resData || typeof resData !== 'object') {
    return i18n.t(i18nPrefix + 'error.unknownError');
  }

  // 业务错误体 code !== 0 的情况：兼容 { code, msg, data }
  if (typeof (resData as { code?: unknown }).code === 'number' && (resData as { code: number }).code !== 0) {
    const m = (resData as { msg?: unknown }).msg;
    if (typeof m === 'string' && m.trim()) return m.trim();
  }

  const { reason, msg, message, code } = resData as HttpResponse & { msg?: string; message?: string };

  if (reason) {
    const key = i18nPrefix + `reason.${reason}`;
    if (i18n.exists(key, { ns: 'common' })) {
      return i18n.t(key, { ns: 'common' });
    }
  }

  if (typeof msg === 'string' && msg.trim()) {
    return msg.trim();
  }

  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }

  if (code) {
    const statusKey = i18nPrefix + `status.${code}`;
    if (i18n.exists(statusKey, { ns: 'common' })) {
      return i18n.t(statusKey, { ns: 'common' });
    }
  }

  return i18n.t(i18nPrefix + 'error.unknownError', { ns: 'common' });
}
