import ContentContainer from '@/layouts/components/PageContainer/ContentContainer';
import { Row, Col, Spin } from 'antd';
import { UserOutlined, TeamOutlined, LoginOutlined, AuditOutlined } from '@ant-design/icons';
import { useI18n } from '@/core/i18n';
import { useDashboardOverview, useLoginStatusDistribution, useLoginTrend, useOperationActionDistribution } from '@/api/hooks/dashboard';
import { SourceDonutChart, SourcePieChart, StatsCard, TrendChart } from '../components';

const Analytics = () => {
  const { t } = useI18n('dashboard');
  const overviewQuery = useDashboardOverview();
  const trendQuery = useLoginTrend(7);
  const actionDistQuery = useOperationActionDistribution();
  const statusDistQuery = useLoginStatusDistribution();

  if (overviewQuery.isLoading) {
    return (
      <ContentContainer heightMode="auto" scrollable padding="16px">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin size="large" />
        </div>
      </ContentContainer>
    );
  }

  const d = overviewQuery.data;
  const iconPool = [
    <UserOutlined style={{ fontSize: 22, color: 'currentColor' }} />,
    <TeamOutlined style={{ fontSize: 22, color: 'currentColor' }} />,
    <LoginOutlined style={{ fontSize: 22, color: 'currentColor' }} />,
    <AuditOutlined style={{ fontSize: 22, color: 'currentColor' }} />,
  ];
  const tones = ['blue', 'cyan', 'violet', 'emerald'] as const;
  const values = [d?.userCount ?? 0, d?.roleCount ?? 0, d?.todayLoginCount ?? 0, d?.todayOperationCount ?? 0];
  const titleKeys = ['stats.userCount', 'stats.roleCount', 'stats.todayLoginCount', 'stats.todayOperationCount'];

  return (
    <ContentContainer heightMode="auto" scrollable padding="16px">
      <Row gutter={[16, 16]}>
        {values.map((v, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <StatsCard title={t(titleKeys[i]!)} value={v} icon={iconPool[i]} tone={tones[i]} />
          </Col>
        ))}
      </Row>
      <TrendChart data={trendQuery.data} />
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <SourceDonutChart data={actionDistQuery.data} />
        </Col>
        <Col xs={24} lg={12}>
          <SourcePieChart data={statusDistQuery.data} />
        </Col>
      </Row>
    </ContentContainer>
  );
};

export default Analytics;
