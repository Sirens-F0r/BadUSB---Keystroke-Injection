// KDS Guard – System Overview Cards

import { ReactElement } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';
import { SystemMetric } from 'data/system-overview-data';

const StatusItem = ({ metric }: { metric: SystemMetric }): ReactElement => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={2}
      sx={{ flex: 1, minWidth: 200, px: 3, py: 2.5 }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => {
            const colorVal = theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(0,0,0,0.06)';
            return colorVal;
          },
          flexShrink: 0,
        }}
      >
        <IconifyIcon icon={metric.icon} width={22} height={22} sx={{ color: metric.color }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h5"
          color="text.primary"
          fontFamily="monospace"
          fontWeight={700}
          lineHeight={1.2}
          noWrap
        >
          {metric.value}
        </Typography>
        <Typography variant="caption" color="text.disabled" display="block" noWrap>
          {metric.label}
        </Typography>
      </Box>
    </Stack>
  );
};

const SystemOverview = (): ReactElement => {
  const { systemOverview } = useDashboardSnapshot();

  return (
    <Box mb={3}>
      <Stack
        direction="row"
        alignItems="stretch"
        flexWrap="wrap"
        divider={
          <Box
            sx={{
              width: 1,
              bgcolor: 'divider',
              alignSelf: 'stretch',
              display: { xs: 'none', md: 'block' },
            }}
          />
        }
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {systemOverview.metrics.map((metric) => (
          <StatusItem key={metric.id} metric={metric} />
        ))}
      </Stack>
    </Box>
  );
};

export default SystemOverview;
