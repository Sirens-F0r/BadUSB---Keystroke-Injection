// KDS Guard – Risk Score Section
// Thay thế Level: hiển thị risk score history chart

import { Box, Button, Divider, Paper, Stack, Typography, alpha, useTheme } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { ReactElement, useEffect, useRef } from 'react';
import RiskScoreChart from './RiskScoreChart';
import { riskScoreHistory } from 'data/chart-data/risk-score';

const RiskScore = (): ReactElement => {
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
        Điểm rủi ro
      </Typography>
      <Typography variant="body2" color="text.disabled" mt={1}>
        Hiện tại: <Typography component="span" color="success.main" fontWeight={700}>0.12</Typography> (An toàn)
      </Typography>
      <RiskScoreChart
        chartRef={chartRef}
        data={riskScoreHistory}
        sx={{ height: '181px !important', flexGrow: 1 }}
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
      </Stack>
    </Paper>
  );
};

export default RiskScore;
