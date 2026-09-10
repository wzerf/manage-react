import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Spin, Alert } from 'antd';
import { useLocation } from 'react-router-dom';

import { usePreferences } from '@/core/preferences';
import { useI18n } from '@/core/i18n';

import './iframe-layout.less';

/**
 * 校验 iframe src 是否安全。
 * 允许：同源相对路径（以 / 开头且不以 // 开头），或 https 绝对 URL。
 * 拒绝：http、//、javascript:、data:、及其他任意 scheme（防 iframe 注入/钓鱼）。
 * 返回安全后的 src，不安全返回空串。
 */
function sanitizeIframeSrc(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  // 同源相对路径
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  // 仅允许 https 绝对 URL
  try {
    const u = new URL(trimmed);
    if (u.protocol === 'https:') return trimmed;
  } catch {
    // 非合法 URL
  }
  return '';
}

/**
 * Iframe 布局：嵌入外部系统（如报表、文档等）
 * 支持：自动高度、加载状态、跨域通信
 */
const IFrameLayout = () => {
  const location = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = usePreferences();
  const { t } = useI18n('common');

  // 从路由 state 或 query 获取 iframe URL（经安全校验）
  const iframeSrc = useMemo(() => {
    const candidate =
      (location.state?.url as string | undefined) ??
      new URLSearchParams(location.search).get('url') ??
      '';
    // 无论是路由 state 还是 query，都需校验，避免注入任意 url（如 ?url=https://evil.com）
    return sanitizeIframeSrc(candidate);
  }, [location.state, location.search]);

  // 计算 iframe src 的 origin，用于校验 postMessage 来源/目标
  const iframeOrigin = useMemo(() => {
    if (!iframeSrc) return '';
    try {
      // 同源相对路径时 origin 即当前页 origin
      if (iframeSrc.startsWith('/')) return window.location.origin;
      return new URL(iframeSrc).origin;
    } catch {
      return '';
    }
  }, [iframeSrc]);

  // iframe 加载完成
  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  // iframe 加载失败
  const handleError = useCallback(() => {
    setLoading(false);
    setError(t('iframe.loadErrorDesc'));
  }, [t]);

  // 跨域通信：监听 iframe 发来的消息
  // 将耗时样式写操作放到 rAF、状态更新放到 microtask，避免阻塞 message 事件主线程
  // Chrome 对 message handler 超过 ~50ms 会报 [Violation] 'message' handler took xxxms
  useEffect(() => {
    if (!iframeOrigin) return;

    let rafId: number | null = null;
    let pendingHeight: number | null = null;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== iframeOrigin) return;
      const payload = event.data as { type?: string; data?: any } | null;
      if (!payload || typeof payload.type !== 'string') return;

      switch (payload.type) {
        case 'resize': {
          const h = payload.data?.height;
          if (typeof h !== 'number' || !iframeRef.current) break;
          pendingHeight = h;
          if (rafId === null) {
            rafId = requestAnimationFrame(() => {
              if (iframeRef.current && pendingHeight !== null) {
                iframeRef.current.style.height = `${pendingHeight}px`;
              }
              rafId = null;
              pendingHeight = null;
            });
          }
          break;
        }
        case 'route-change':
          if (import.meta.env.DEV) {
            console.log('[IFrame] route change:', payload.data);
          }
          break;
        case 'ready':
          queueMicrotask(() => setLoading(false));
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [iframeOrigin]);

  // 向 iframe 发送消息（跨域通信）
  const postMessageToIframe = useCallback(
    (type: string, data?: any) => {
      if (!iframeRef.current?.contentWindow || !iframeOrigin) return;
      // targetOrigin 指定具体 origin 而非 '*'，避免把主题模式等信息泄露给任意监听者
      iframeRef.current.contentWindow.postMessage({ type, data }, iframeOrigin);
    },
    [iframeOrigin],
  );

  // 主题切换时通知 iframe
  useEffect(() => {
    if (!loading) {
      postMessageToIframe('theme-change', { mode: isDark ? 'dark' : 'light' });
    }
  }, [isDark, loading, postMessageToIframe]);

  // 无 URL 时显示提示
  if (!iframeSrc) {
    return (
      <div className="iframe-layout-empty">
        <Alert
          type="warning"
          title={t('iframe.noUrlTitle')}
          description={t('iframe.noUrlDesc')}
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="iframe-layout-wrapper">
      {loading && (
        <div className="iframe-layout-loading">
          <Spin size="large" description={t('iframe.loading')} />
        </div>
      )}

      {error && (
        <div className="iframe-layout-error">
          <Alert type="error" title={t('iframe.loadErrorTitle')} description={error} showIcon />
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="iframe-layout-content"
        onLoad={handleLoad}
        onError={handleError}
        title={t('iframe.embeddedPage')}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
        allow="clipboard-read; clipboard-write"
        style={{ visibility: loading ? 'hidden' : 'visible' }}
      />
    </div>
  );
};

export default IFrameLayout;
