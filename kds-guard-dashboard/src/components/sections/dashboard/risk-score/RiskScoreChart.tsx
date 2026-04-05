// KDS Guard – Risk Score Chart
// Biểu đồ risk score history

import { SxProps, useTheme } from '@mui/material';
import ReactEChart from 'components/base/ReactEChart';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent, GridComponent } from 'echarts/components';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { MutableRefObject } from 'react';
import { riskScoreLabels } from 'data/chart-data/risk-score';

echarts.use([LineChart, CanvasRenderer, TooltipComponent, GridComponent]);

interface RiskScoreChartProps {
  chartRef: MutableRefObject<EChartsReactCore | null>;
  data: number[];
  sx?: SxProps;
}

const RiskScoreChart = ({ chartRef, data, sx }: RiskScoreChartProps) => {
  const theme = useTheme();

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: { value: number }[]) => {
        const val = params[0].value;
        const status = val > 0.7 ? '🔴 ATTACK' : val > 0.4 ? '🟡 WARNING' : '🟢 SAFE';
        return `Risk Score: ${val}<br/>${status}`;
      },
    },
    grid: {
      top: 20,
      right: 10,
      bottom: 20,
      left: 40,
    },
    xAxis: {
      type: 'category',
      data: riskScoreLabels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: theme.palette.text.disabled,
        fontSize: 10,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
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
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: theme.palette.success.main },
            { offset: 0.5, color: theme.palette.warning.main },
            { offset: 1, color: theme.palette.error.main },
          ]),
          width: 3,
        },
        itemStyle: {
          color: (params: { value: number }) => {
            const val = params.value;
            if (val > 0.7) return theme.palette.error.main;
            if (val > 0.4) return theme.palette.warning.main;
            return theme.palette.success.main;
          },
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 146, 126, 0.3)' },
            { offset: 1, color: 'rgba(0, 146, 126, 0.02)' },
          ]),
        },
      },
    ],
  };

  return <ReactEChart ref={chartRef} option={option} echarts={echarts} sx={sx} />;
};

export default RiskScoreChart;
