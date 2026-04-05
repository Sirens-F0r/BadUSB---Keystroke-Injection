// KDS Guard – System Overview Cards

import { ReactElement } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import systemOverviewData from 'data/system-overview-data';
import StatusCard from './StatusCard';

const SystemOverview = (): ReactElement => {
  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white" mb={1.25}>
        Tổng quan hệ thống
      </Typography>
      <Typography variant="subtitle2" color="text.disabled" mb={6}>
        Tr\u1ea1ng th\u00e1i b\u1ea3o v\u1ec7 KDS Guard
      </Typography>
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={{ xs: 4, sm: 6 }}>
        {systemOverviewData.map((metric) => (
          <Box key={metric.id} gridColumn={{ xs: 'span 12', sm: 'span 6', lg: 'span 3' }}>
            <StatusCard metric={metric} />
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default SystemOverview;
