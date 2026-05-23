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

  // Tìm key chứa "BadUSB" hoặc "Injection" để phân biệt với normal
  const keys = Object.keys(data);
  const injectionKey = keys.find(
    (k) => k.toLowerCase().includes('badusb') || k.toLowerCase().includes('injection'),
  );
  const normalKey = keys.find(
    (k) => k.toLowerCase().includes('tb') || k.toLowerCase().includes('normal') || k.toLowerCase().includes('user'),
  );

  // Fallback: first key = normal, last key = injection
  const normalData = data[normalKey ?? keys[0]] ?? [];
  const injectionData = data[injectionKey ?? keys[keys.length - 1]] ?? [];

  // Tính max value dựa trên dữ liệu thực tế cho scale hợp lý
  const maxValues = keystrokeMetricsLabels.map((_, i) => {
    const allValues = keys.map((k) => data[k]?.[i] ?? 0);
    const maxVal = Math.max(...allValues);
    return Math.ceil(maxVal * 1.2) || 100; // +20% padding, fallback 100
  });

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
      radius: '65%',
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
            value: normalData,
            name: normalKey ?? 'Người dùng',
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
            value: injectionData,
            name: injectionKey ?? 'BadUSB',
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
