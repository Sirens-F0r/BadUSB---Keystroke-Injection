// KDS Guard – Status Card Component
// Thay thế SaleCard: hiển thị một metric bảo mật

import { ReactElement } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { SystemMetric } from 'data/system-overview-data';

const StatusCard = ({ metric }: { metric: SystemMetric }): ReactElement => {
  return (
    <Stack gap={4} p={5} borderRadius={4} height={1} bgcolor="background.default">
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${metric.color}`,
          opacity: 0.15,
          position: 'relative',
        }}
      >
        <IconifyIcon
          icon={metric.icon}
          width={24}
          height={24}
          sx={{
            position: 'absolute',
            color: metric.color,
            opacity: 1,
          }}
        />
      </Box>
      <Box>
        <Typography variant="h4" color="common.white" mb={2}>
          {metric.value}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={1}>
          {metric.label}
        </Typography>
        <Typography variant="body2" color={metric.color} lineHeight={1.25}>
          {metric.description}
        </Typography>
      </Box>
    </Stack>
  );
};

export default StatusCard;
