// KDS Guard – Keystroke Metrics Comparison Chart Section

import { ReactElement, useEffect, useRef } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import KeystrokeMetricsChart from './KeystrokeMetricsChart';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';

const KeystrokeMetrics = (): ReactElement => {
  const { keystrokeMetrics } = useDashboardSnapshot();
  const chartRef = useRef<EChartsReactCore | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        try {
          chartRef.current.getEchartsInstance().resize();
        } catch {
          // Chart instance not ready
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chartRef]);

  return (
    <Paper sx={{ p: 3, borderRadius: 3, height: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" color="text.primary" fontWeight={600}>
          So sánh hành vi gõ
        </Typography>
        <Stack direction="row" gap={2}>
          <Stack direction="row" alignItems="center" gap={0.75}>
            <Box sx={{ width: 8, height: 3, bgcolor: 'primary.main', borderRadius: 1 }} />
            <Typography variant="caption" color="text.disabled">Người dùng</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap={0.75}>
            <Box sx={{ width: 8, height: 3, bgcolor: 'error.main', borderRadius: 1 }} />
            <Typography variant="caption" color="text.disabled">BadUSB</Typography>
          </Stack>
        </Stack>
      </Box>
      <KeystrokeMetricsChart
        chartRef={chartRef}
        sx={{ height: '300px !important', flexGrow: 1 }}
        data={keystrokeMetrics}
      />
    </Paper>
  );
};

export default KeystrokeMetrics;
