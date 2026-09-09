import ContentContainer from '@/layouts/components/PageContainer/ContentContainer';
import { Card, Row, Col, List, Tag, Typography } from 'antd';
import { useI18n } from '@/core/i18n';

const quickNav = [
  { title: '首页', url: '/', color: '#1fdaca' },
  { title: '分析页', url: '/dashboard/analytics', color: '#bf0c2c' },
  { title: '工作台', url: '/dashboard/workspace', color: '#e18525' },
];

const Workspace = () => {
  const { t } = useI18n('dashboard');
  return (
    <ContentContainer heightMode="auto" scrollable padding="16px">
      <Card title={t('workspace.title', { defaultValue: '工作台' })}>
        <Typography.Paragraph type="secondary">
          {t('workspace.desc', { defaultValue: '对齐 vue 的 workspace 占位页，可接入快捷导航/待办/最新动态等区块。' })}
        </Typography.Paragraph>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card size="small" title="快捷导航">
              <List
                dataSource={quickNav}
                renderItem={(item) => (
                  <List.Item>
                    <Tag color={item.color}>{item.title}</Tag>
                    <Typography.Text type="secondary">{item.url}</Typography.Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card size="small" title="待办示例">
              <List
                dataSource={['审查前端代码', '系统性能优化', '安全检查']}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </ContentContainer>
  );
};

export default Workspace;
