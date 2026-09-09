import { Card, theme } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import type { StatusDistributionResponse } from '@/api/generated/admin/service/v1';
import { useI18n } from '@/core/i18n';

interface SourcePieChartProps {
  data?: StatusDistributionResponse;
}

/**
 * 登录成功/失败占比饼图。
 * 后端返回 status 枚举名（SUCCESS/FAILED/...），这里经 i18n 转成本地化文案展示。
 */
const STATUS_LABELS: Record<string, string> = { SUCCESS: '成功', FAILED: '失败', PARTIAL: '部分成功' };

export const SourcePieChart = ({ data }: SourcePieChartProps) => {
  const { token } = theme.useToken();
  const { t } = useI18n('dashboard');

  const statusColors: Record<string, string> = { SUCCESS: '#34D399', FAILED: '#F87171', PARTIAL: '#FBBF24' };
  const fallbackColor = '#94A3B8';

  const option = useMemo(() => {
    const items = data?.items ?? [];

    const statusLabel = (label?: string): string => STATUS_LABELS[label ?? ''] ?? label ?? '';

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(20,20,30,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        textStyle: { color: '#e2e8f0' },
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        data: items.map((it) => statusLabel(it.label)),
        textStyle: {
          color: '#94a3b8',
          fontSize: 12,
        },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 16,
      },
      series: [
        {
          name: t('charts.loginStatusDistribution'),
          type: 'pie',
          radius: ['35%', '75%'],
          center: ['50%', '48%'],
          roseType: 'area',
          itemStyle: {
            borderRadius: 8,
            borderColor: token.colorBgContainer,
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            scaleSize: 8,
          },
          data: items.map((it) => ({
            value: it.count,
            name: statusLabel(it.label),
            itemStyle: { color: statusColors[it.label ?? ''] ?? fallbackColor },
          })),
        },
      ],
    };
  }, [data, token, t]);

  return (
    <Card title={t('charts.loginStatusDistribution')} style={{ height: '100%' }}>
      <ReactECharts option={option} style={{ height: 280 }} />
    </Card>
  );
};
