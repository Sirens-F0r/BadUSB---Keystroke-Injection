// KDS Guard – Keystroke Metrics Comparison Chart Section

import { ReactElement, useEffect, useRef } from 'react';
import { Box, Button, Divider, Paper, Stack, Typography, alpha, useTheme } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import KeystrokeMetricsChart from './KeystrokeMetricsChart';
import { keystrokeMetricsData } from 'data/chart-data/keystroke-metrics';

const KeystrokeMetrics = (): ReactElement => {
  const theme = useTheme();
  const chartRef = useRef<EChartsReactCore | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.getEchartsInstance().resize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chartRef]);

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white">
        So sánh hành vi gõ phím
      </Typography>
      <Typography variant="body2" color="text.disabled" mt={1} mb={2}>
        Người dùng bình thường vs Mẫu BadUSB
      </Typography>
      <KeystrokeMetricsChart
        chartRef={chartRef}
        sx={{ height: '220px !important', flexGrow: 1 }}
        data={keystrokeMetricsData}
      />
      <Stack
        direction="row"
        justifyContent="space-around"
        divider={
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: alpha(theme.palette.common.white, 0.06), height: 1 }}
          />
        }
        px={2}
        pt={3}
      >
        <Stack gap={1.25} alignItems="center">
          <Button
            variant="text"
            sx={{
              p: 0.5,
              borderRadius: 1,
              fontSize: 'body2.fontSize',
              color: 'text.disabled',
              '&:hover': { bgcolor: 'transparent' },
              '& .MuiButton-startIcon': { mx: 0, mr: 1 },
            }}
            disableRipple
            startIcon={
              <Box sx={{ width: 6, height: 6, bgcolor: 'primary.main', borderRadius: 400 }} />
            }
          >
            Người dùng bình thường
          </Button>
        </Stack>
        <Stack gap={1.25} alignItems="center">
          <Button
            variant="text"
            sx={{
              p: 0.5,
              borderRadius: 1,
              fontSize: 'body2.fontSize',
              color: 'text.disabled',
              '&:hover': { bgcolor: 'transparent' },
              '& .MuiButton-startIcon': { mx: 0, mr: 1 },
            }}
            disableRipple
            startIcon={
              <Box sx={{ width: 6, height: 6, bgcolor: 'error.main', borderRadius: 400 }} />
            }
          >
            Mẫu BadUSB
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default KeystrokeMetrics;
