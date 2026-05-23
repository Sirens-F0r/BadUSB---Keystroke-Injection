// KDS Guard – Risk Score Section
// Hiển thị risk score history chart

import { Box, Button, Paper, Typography } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { ReactElement, useEffect, useRef } from 'react';
import RiskScoreChart from './RiskScoreChart';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';

function scoreColor(score: number): 'success.main' | 'warning.main' | 'error.main' {
  if (score > 0.7) return 'error.main';
  if (score > 0.4) return 'warning.main';
  return 'success.main';
}

const RiskScore = (): ReactElement => {
  const { riskScore, systemOverview } = useDashboardSnapshot();
  const cur = systemOverview.currentRiskScore;
  const label =
    cur > 0.7 ? 'Nguy hiểm' : cur > 0.4 ? 'Cảnh báo' : 'An toàn';
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
          Điểm rủi ro
        </Typography>
        <Button
          variant="text"
          sx={{
            justifyContent: 'flex-start',
            p: 0.5,
            borderRadius: 1,
            gap: 2.5,
            color: 'text.disabled',
            fontSize: 'body2.fontSize',
            alignItems: 'baseline',
            '&:hover': { bgcolor: 'transparent' },
            '& .MuiButton-startIcon': { mx: 0 },
          }}
          disableRipple
          startIcon={
            <Box sx={{ width: 8, height: 8, mb: 1, bgcolor: 'success.main', borderRadius: 400 }} />
          }
        >
          Bình thường
        </Button>
        <Button
          variant="text"
          sx={{
            justifyContent: 'flex-start',
            p: 0.5,
            borderRadius: 1,
            gap: 2.5,
            color: 'text.disabled',
            fontSize: 'body2.fontSize',
            alignItems: 'baseline',
            '&:hover': { bgcolor: 'transparent' },
            '& .MuiButton-startIcon': { mx: 0 },
          }}
          disableRipple
          startIcon={
            <Box sx={{ width: 8, height: 8, mb: 1, bgcolor: 'error.main', borderRadius: 400 }} />
          }
        >
          Tấn công
        </Button>
      </Box>
      <Typography variant="body2" color="text.disabled" mb={2}>
        Hiện tại:{' '}
        <Typography component="span" color={scoreColor(cur)} fontWeight={700}>
          {cur.toFixed(2)}
        </Typography>{' '}
        ({label}) · {systemOverview.lastUpdated.slice(0, 16).replace('T', ' ')}
      </Typography>
      <RiskScoreChart
        chartRef={chartRef}
        data={riskScore.history}
        labels={riskScore.labels}
        sx={{ height: '181px !important', flexGrow: 1 }}
      />
    </Paper>
  );
};

export default RiskScore;
