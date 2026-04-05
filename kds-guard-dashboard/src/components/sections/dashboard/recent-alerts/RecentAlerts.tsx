// KDS Guard – Recent Alerts Section
// Hiển thị các cảnh báo gần đây

import { ReactElement } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { recentAlertsData, AlertSeverity } from 'data/recent-alerts-data';
import IconifyIcon from 'components/base/IconifyIcon';

const severityConfig: Record<AlertSeverity, { color: 'error' | 'warning' | 'info' | 'success'; icon: string }> = {
  CRITICAL: { color: 'error', icon: 'mdi:alert-octagon' },
  HIGH: { color: 'warning', icon: 'mdi:alert' },
  MEDIUM: { color: 'info', icon: 'mdi:alert-circle-outline' },
  LOW: { color: 'success', icon: 'mdi:information-outline' },
};

const RecentAlerts = (): ReactElement => {
  return (
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white" mb={6}>
        Cảnh báo gần đây
      </Typography>
      <Stack gap={3}>
        {recentAlertsData.map((alert) => {
          const config = severityConfig[alert.severity];
          return (
            <Box
              key={alert.id}
              sx={{
                p: 4,
                borderRadius: 2,
                bgcolor: 'background.default',
                borderLeft: `3px solid`,
                borderColor: `${config.color}.main`,
              }}
            >
              <Stack direction="row" alignItems="center" gap={2} mb={2}>
                <IconifyIcon icon={config.icon} width={20} height={20} color={`${config.color}.main`} />
                <Typography variant="body1" color="common.white" fontWeight={600} flex={1}>
                  {alert.title}
                </Typography>
                <Chip
                  label={alert.severity}
                  size="small"
                  color={config.color}
                  sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                />
              </Stack>
              <Typography variant="body2" color="text.disabled" mb={1.5}>
                {alert.description}
              </Typography>
              <Stack direction="row" gap={3} flexWrap="wrap">
                <Typography variant="caption" color="text.disabled">
                  🕐 {alert.timestamp}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  📌 {alert.source}
                </Typography>
                <Typography variant="caption" color="primary.main">
                  ⚡ {alert.action}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default RecentAlerts;
