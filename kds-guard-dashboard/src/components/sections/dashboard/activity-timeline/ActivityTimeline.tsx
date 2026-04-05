// KDS Guard – Activity Timeline Chart Section
// Thay thế VisitorInsights: biểu đồ hoạt động gõ phím theo thời gian

import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import ActivityTimelineChart from './ActivityTimelineChart';
import { ReactElement, useEffect, useRef } from 'react';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { activityTimelineData } from 'data/chart-data/activity-timeline';

const ActivityTimeline = (): ReactElement => {
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
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={6}
      >
        <Typography variant="h4" color="common.white">
          Hoạt động gõ phím
        </Typography>
        <Button
          variant="text"
          disableRipple
          startIcon={
            <Box
              sx={{
                width: 5,
                height: 5,
                bgcolor: 'primary.main',
                borderRadius: 400,
              }}
            />
          }
          sx={{
            justifyContent: 'flex-start',
            px: 4,
            py: 2,
            borderRadius: 1,
            alignItems: 'center',
            fontSize: 'body2.fontSize',
            gap: 1,
            color: 'text.disabled',
            bgcolor: 'background.default',
            cursor: 'default',
            '&:hover': { bgcolor: 'background.default' },
            '& .MuiButton-startIcon': { mx: 0 },
          }}
        >
          Sự kiện mỗi giờ
        </Button>
      </Stack>
      <ActivityTimelineChart
        chartRef={chartRef}
        data={activityTimelineData}
        sx={{ height: '342px !important', flexGrow: 1 }}
      />
    </Paper>
  );
};

export default ActivityTimeline;
