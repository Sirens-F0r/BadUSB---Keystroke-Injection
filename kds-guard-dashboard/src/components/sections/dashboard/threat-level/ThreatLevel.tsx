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
    <Paper sx={{ p: 3, borderRadius: 3, height: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" color="text.primary" fontWeight={600}>
            Mức đe dọa
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', maxWidth: 220 }}>
            {systemOverview.threatDescription}
          </Typography>
        </Box>
        <Typography
          variant="h4"
          color="success.main"
          fontFamily="monospace"
          fontWeight={700}
          sx={{ lineHeight: 1, flexShrink: 0, ml: 1 }}
        >
          {systemOverview.threatLevel}
        </Typography>
      </Box>
      <Box
        flex={1}
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 160,
        }}
      >
        <ThreatGaugeChart
          chartRef={chartRef}
          value={gaugeValue}
          sx={{
            width: '100%',
            height: '100%',
            minHeight: 140,
          }}
        />
        <Typography
          variant="h3"
          color="text.primary"
          fontWeight={700}
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {Math.round(gaugeValue)}%
        </Typography>
      </Box>
    </Paper>
  );
};

export default ThreatLevel;
