// KDS Guard – Threat Level Indicator
// Hiển thị mức độ đe dọa hiện tại

import { Box, Paper, Typography } from '@mui/material';
import ThreatGaugeChart from './ThreatGaugeChart';
import { ReactElement, useEffect, useRef } from 'react';
import EChartsReactCore from 'echarts-for-react/lib/core';

const ThreatLevel = (): ReactElement => {
  const chartRef = useRef<EChartsReactCore | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const echartsInstance = chartRef.current.getEchartsInstance();
        echartsInstance.resize({ width: 'auto', height: 'auto' });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chartRef]);

  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white" mb={2.5}>
        Mức đe dọa
      </Typography>
      <Typography variant="body1" color="text.primary" mb={4.5}>
        Đánh giá rủi ro hiện tại
      </Typography>
      <Typography
        variant="h1"
        color="success.main"
        mb={4.5}
        fontSize={{ xs: 'h2.fontSize', sm: 'h1.fontSize' }}
      >
        LOW
      </Typography>
      <Typography variant="body1" color="text.primary" mb={10}>
        No active threats detected in the last 6 hours
      </Typography>
      <Box
        flex={1}
        sx={{ position: 'relative' }}
      >
        <ThreatGaugeChart
          chartRef={chartRef}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flex: '1 1 0%',
            maxHeight: 152,
          }}
        />
        <Typography
          variant="h1"
          color="common.white"
          textAlign="center"
          mx="auto"
          position="absolute"
          left={0}
          right={0}
          bottom={0}
        >
          12%
        </Typography>
      </Box>
    </Paper>
  );
};

export default ThreatLevel;
