// KDS Guard – Activity Timeline Chart Section
// Biểu đồ hoạt động gõ phím theo thời gian

import { Box, Paper, Typography } from '@mui/material';
import ActivityTimelineChart from './ActivityTimelineChart';
import { ReactElement, useEffect, useRef } from 'react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';

const ActivityTimeline = (): ReactElement => {
  const { activityTimeline } = useDashboardSnapshot();
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
        <Typography variant="h5" color="text.primary" fontWeight={600}>
          Hoạt động gõ phím
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Sự kiện mỗi giờ
        </Typography>
      </Box>
      <ActivityTimelineChart
        chartRef={chartRef}
        data={activityTimeline.values}
        labels={activityTimeline.labels}
        sx={{ height: '280px !important', flexGrow: 1 }}
      />
    </Paper>
  );
};

export default ActivityTimeline;
