// KDS Guard – Keystroke Metrics Comparison Chart
// Biểu đồ radar: so sánh các metric giữa Normal User và BadUSB

import { SxProps, useTheme } from '@mui/material';
import ReactEChart from 'components/base/ReactEChart';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { MutableRefObject } from 'react';
import { keystrokeMetricsLabels } from 'data/chart-data/keystroke-metrics';

echarts.use([RadarChart, CanvasRenderer, TooltipComponent, LegendComponent]);

interface KeystrokeMetricsChartProps {
  chartRef: MutableRefObject<EChartsReactCore | null>;
  data: Record<string, number[]>;
  sx?: SxProps;
}

const KeystrokeMetricsChart = ({ chartRef, data, sx }: KeystrokeMetricsChartProps) => {
  const theme = useTheme();

  const maxValues = [200, 100, 25, 50, 20, 60, 40];

  const option = {
    tooltip: {
      trigger: 'item',
    },
    radar: {
      indicator: keystrokeMetricsLabels.map((label, index) => ({
        name: label,
        max: maxValues[index],
      })),
      shape: 'polygon',
      splitArea: {
        areaStyle: {
          color: ['transparent'],
        },
      },
      splitLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      axisLine: {
        lineStyle: {
          color: theme.palette.divider,
        },
      },
      axisName: {
        color: theme.palette.text.disabled,
        fontSize: 9,
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: data['Normal User'],
            name: 'Normal User',
            lineStyle: {
              color: theme.palette.primary.main,
              width: 2,
            },
            areaStyle: {
              color: `${theme.palette.primary.main}33`,
            },
            itemStyle: {
              color: theme.palette.primary.main,
            },
          },
          {
            value: data['BadUSB Pattern'],
            name: 'BadUSB Pattern',
            lineStyle: {
              color: theme.palette.error.main,
              width: 2,
            },
            areaStyle: {
              color: `${theme.palette.error.main}33`,
            },
            itemStyle: {
              color: theme.palette.error.main,
            },
          },
        ],
      },
    ],
  };

  return <ReactEChart ref={chartRef} option={option} echarts={echarts} sx={sx} />;
};

export default KeystrokeMetricsChart;
