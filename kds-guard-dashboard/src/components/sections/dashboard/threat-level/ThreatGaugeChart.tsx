// KDS Guard – Threat Gauge Chart
// Biểu đồ gauge hiển thị mức độ đe dọa hiện tại

import { SxProps, useTheme } from '@mui/material';
import ReactEChart from 'components/base/ReactEChart';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { MutableRefObject } from 'react';

echarts.use([GaugeChart, CanvasRenderer, TooltipComponent]);

interface ThreatGaugeChartProps {
  chartRef: MutableRefObject<EChartsReactCore | null>;
  sx?: SxProps;
}

const ThreatGaugeChart = ({ chartRef, sx }: ThreatGaugeChartProps) => {
  const theme = useTheme();

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 4,
        pointer: { show: false },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: theme.palette.success.main },
                { offset: 0.5, color: theme.palette.warning.main },
                { offset: 1, color: theme.palette.error.main },
              ],
            },
          },
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, theme.palette.grey[800]]],
          },
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [{ value: 12 }],
        detail: { show: false },
      },
    ],
  };

  return <ReactEChart ref={chartRef} option={option} echarts={echarts} sx={sx} />;
};

export default ThreatGaugeChart;
