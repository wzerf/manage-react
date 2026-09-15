import { App as AntdApp } from 'antd';
import { useEffect } from 'react';

import { AppRouter } from '@/router';
import { useLocaleSync } from '@/core/i18n/hooks/useLocaleSync';
import { setAppMessage } from '@/utils/app-message';

function AppMessageRegistrar() {
  const { message } = AntdApp.useApp();
  useEffect(() => {
    setAppMessage(message);
  }, [message]);
  return null;
}

function App() {
  useLocaleSync();

  return (
    <>
      <AppMessageRegistrar />
      <AppRouter />
    </>
  );
}

export default App;
