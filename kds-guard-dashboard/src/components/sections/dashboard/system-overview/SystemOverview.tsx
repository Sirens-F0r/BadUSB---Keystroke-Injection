// KDS Guard – System Overview Cards

import { ReactElement } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';
import { SystemMetric } from 'data/system-overview-data';

const StatusItem = ({ metric }: { metric: SystemMetric }): ReactElement => {
  return (
    <Stack direction="row" alignItems="center" gap={3} flex={1} minWidth={180}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${metric.color}`,
          flexShrink: 0,
        }}
      >
        <IconifyIcon icon={metric.icon} width={22} height={22} color="text.primary" />
      </Box>
      <Box>
        <Typography
          variant="h4"
          color="text.primary"
          fontFamily="monospace"
          fontWeight={700}
          lineHeight={1}
          mb={0.5}
        >
          {metric.value}
        </Typography>
        <Typography variant="caption" color="text.disabled" display="block">
          {metric.label}
        </Typography>
      </Box>
    </Stack>
  );
};

const SystemOverview = (): ReactElement => {
  const { systemOverview } = useDashboardSnapshot();

  return (
    <Box mb={4}>
      <Stack
        direction="row"
        alignItems="stretch"
        gap={0}
        divider={
          <Box
            sx={{
              width: 1,
              bgcolor: 'divider',
              alignSelf: 'stretch',
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
