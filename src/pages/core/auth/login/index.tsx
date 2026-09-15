import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Button, Checkbox, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { prepareGlobalPublicKey } from '@/core/transport/rest/security';
import { useAuthStore } from '@/stores';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AltchaWidget, { type AltchaWidgetHandle } from './AltchaWidget';
import '../auth-form.style.less';

const Login: React.FC = () => {
  const { t } = useTranslation('auth');
  const { login, loginLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const altchaRef = useRef<AltchaWidgetHandle>(null);

  useEffect(() => {
    void prepareGlobalPublicKey(import.meta.env.VITE_API_URL || '/api');
  }, []);

  const resetAltcha = () => {
    form.setFieldValue('altcha', undefined);
    altchaRef.current?.reset();
  };

  const handleSubmit = async (values: {
    username: string;
    password: string;
    remember?: boolean;
    altcha?: string;
  }) => {
    try {
      await login(
        {
          username: values.username,
          password: values.password,
          altcha: values.altcha,
        },
        { remember: values.remember ?? true },
      );

      message.success(t('loginSuccess'));
      const rawRedirect = searchParams.get('redirect');
      const userHomePath = useAuthStore.getState().userInfo?.homePath;
      const redirect = rawRedirect ? decodeURIComponent(rawRedirect) : (userHomePath || '/');
      navigate(redirect, { replace: true });
    } catch {
      resetAltcha();
    }
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-header">
        <h2 className="auth-form-title">{t('welcomeBack')}</h2>
        <p className="auth-form-description">
          {t('loginDescription')}
        </p>
      </div>

      <Form
        form={form}
        name="login"
        onFinish={handleSubmit}
        size="large"
        initialValues={{ remember: true }}
      >
        <Form.Item
          name="username"
          className="auth-form-item"
          rules={[
            {
              required: true,
              message: t('usernameRequired'),
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder={t('usernamePlaceholder')}
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          name="password"
          className="auth-form-item"
          rules={[
            {
              required: true,
              message: t('passwordRequired'),
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={t('passwordPlaceholder')}
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item
          name="altcha"
          className="auth-form-item"
          rules={[
            {
              required: true,
              message: t('altchaRequired', { defaultValue: '请先完成人机校验' }),
            },
          ]}
        >
          <AltchaWidget ref={altchaRef} language="zh" />
        </Form.Item>
        <Form.Item className="auth-remember-checkbox">
          <div className="flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>{t('rememberAccount')}</Checkbox>
            </Form.Item>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loginLoading}
            block
            className="auth-submit-button"
          >
            {loginLoading ? t('loggingIn') : t('loginButton')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
