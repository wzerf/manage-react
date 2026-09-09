import ContentContainer from '@/layouts/components/PageContainer/ContentContainer';
import { Card, Space, Button, message, notification } from 'antd';

type NotificationType = 'error' | 'info' | 'success' | 'warning';

const Demos = () => (
  <ContentContainer heightMode="auto" scrollable padding="16px">
    <Card title="按钮" style={{ marginBottom: 16 }}>
      <Space>
        <Button>Default</Button>
        <Button type="primary">Primary</Button>
        <Button>Info</Button>
        <Button danger>Error</Button>
      </Space>
    </Card>
    <Card title="Message" style={{ marginBottom: 16 }}>
      <Space>
        <Button onClick={() => message.info('How many roads must a man walk down')}>信息</Button>
        <Button danger onClick={() => message.error({ content: 'Once upon a time you dressed so fine', duration: 2.5 })}>
          错误
        </Button>
        <Button onClick={() => message.warning('How many roads must a man walk down')}>警告</Button>
        <Button onClick={() => message.success('Cause you walked hand in hand With another man in my place')}>成功</Button>
      </Space>
    </Card>
    <Card title="Notification">
      <Space>
        {(['info', 'error', 'warning', 'success'] as NotificationType[]).map((type) => (
          <Button key={type} danger={type === 'error'} onClick={() => notification[type]({ message: '说点啥呢', duration: 2.5 })}>
            {type}
          </Button>
        ))}
      </Space>
    </Card>
  </ContentContainer>
);

export default Demos;
