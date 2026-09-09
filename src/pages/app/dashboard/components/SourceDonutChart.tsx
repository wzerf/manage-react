import { Card, theme } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import type { ActionDistributionResponse } from '@/api/generated/admin/service/v1';
import { useI18n } from '@/core/i18n';

interface SourceDonutChartProps {
  data?: ActionDistributionResponse;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: '创建',
  UPDATE: '更新',
  DELETE: '删除',
  READ: '查询',
  ASSIGN: '分配',
  UNASSIGN: '取消分配',
  EXPORT: '导出',
  IMPORT: '导入',
  OTHER: '其他',
};

export const SourceDonutChart = ({ data }: SourceDonutChartProps) => {
  const { token } = theme.useToken();
  const { t } = useI18n('dashboard');

  const palette = ['#006BE6', '#22D3EE', '#818CF8', '#34D399', '#A78BFA', '#FBBF24', '#F472B6', '#2DD4BF', '#94A3B8'];
  const actionLabel = (label?: string): string => ACTION_LABELS[label ?? ''] ?? label ?? '';

  const option = useMemo(() => {
    const items = data?.items ?? [];
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
        data: items.map((it) => actionLabel(it.label)),
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
          name: t('charts.operationActionDistribution'),
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '48%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: token.colorBgContainer,
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
            },
            scaleSize: 8,
          },
          labelLine: {
            show: false,
          },
          data: items.map((it, i) => ({
            value: it.count,
            name: actionLabel(it.label),
            itemStyle: { color: palette[i % palette.length] },
          })),
        },
      ],
    };
  }, [data, token, t]);

  return (
    <Card title={t('charts.operationActionDistribution')} style={{ height: '100%' }}>
      <ReactECharts option={option} style={{ height: 280 }} />
    </Card>
  );
};
