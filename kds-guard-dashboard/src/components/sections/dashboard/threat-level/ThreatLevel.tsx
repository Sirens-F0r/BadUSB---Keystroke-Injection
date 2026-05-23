// KDS Guard – Threat Level Indicator
// Hiển thị mức độ đe dọa hiện tại

import { Box, Paper, Typography } from '@mui/material';
import ThreatGaugeChart from './ThreatGaugeChart';
import { ReactElement, useEffect, useRef } from 'react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';

const ThreatLevel = (): ReactElement => {
  const { systemOverview, gaugeValue } = useDashboardSnapshot();
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
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" color="text.primary" fontWeight={600}>
            Mức đe dọa
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {systemOverview.threatDescription}
          </Typography>
        </Box>
        <Typography
          variant="h3"
          color="success.main"
          fontFamily="monospace"
          fontWeight={700}
          sx={{ lineHeight: 1 }}
        >
          {systemOverview.threatLevel}
        </Typography>
      </Box>
      <Box
        flex={1}
        sx={{ position: 'relative' }}
      >
        <ThreatGaugeChart
          chartRef={chartRef}
          value={gaugeValue}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flex: '1 1 0%',
            maxHeight: 120,
          }}
        />
        <Typography
          variant="h3"
          color="text.primary"
          textAlign="center"
          mx="auto"
          position="absolute"
          left={0}
          right={0}
          bottom={0}
        >
          {Math.round(gaugeValue)}%
        </Typography>
      </Box>
    </Paper>
  );
};

export default ThreatLevel;
