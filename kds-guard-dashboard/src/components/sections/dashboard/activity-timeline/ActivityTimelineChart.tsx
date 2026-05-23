// KDS Guard – Activity Timeline Chart
// Biểu đồ bar: số lượng keystroke events theo giờ

import { SxProps, useTheme } from '@mui/material';
import ReactEChart from 'components/base/ReactEChart';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent, GridComponent } from 'echarts/components';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { MutableRefObject } from 'react';
import { activityTimelineLabels } from 'data/chart-data/activity-timeline';

echarts.use([BarChart, CanvasRenderer, TooltipComponent, GridComponent]);

interface ActivityTimelineChartProps {
  chartRef: MutableRefObject<EChartsReactCore | null>;
  data: number[];
  labels?: string[];
  sx?: SxProps;
}

const ActivityTimelineChart = ({ chartRef, data, labels, sx }: ActivityTimelineChartProps) => {
  const theme = useTheme();
  const xLabels = labels?.length === data.length ? labels : activityTimelineLabels;

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { name: string; value: number }[]) => {
        return `${params[0].name}<br/>Events: ${params[0].value}`;
      },
    },
    grid: {
      top: 10,
      right: 10,
      bottom: 30,
      left: 40,
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: theme.palette.text.disabled,
        fontSize: 10,
        interval: 2,
      },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: { color: theme.palette.divider, type: 'dashed' },
      },
      axisLabel: {
        color: theme.palette.text.disabled,
        fontSize: 10,
      },
    },
    series: [
      {
        data: data,
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (params: { value: number }) => {
            const val = params.value;
            if (val > 80) return theme.palette.error.main;
            if (val > 50) return theme.palette.warning.main;
            return theme.palette.primary.main;
          },
        },
      },
    ],
  };

  return <ReactEChart ref={chartRef} option={option} echarts={echarts} sx={sx} />;
};

export default ActivityTimelineChart;
