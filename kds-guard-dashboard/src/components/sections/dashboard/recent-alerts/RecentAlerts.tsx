// KDS Guard – Recent Alerts Section

import { ReactElement } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import type { AlertSeverity } from 'data/recent-alerts-data';
import IconifyIcon from 'components/base/IconifyIcon';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';

const severityConfig: Record<AlertSeverity, { color: 'error' | 'warning' | 'info' | 'success'; icon: string }> = {
  CRITICAL: { color: 'error', icon: 'mdi:alert-octagon' },
  HIGH: { color: 'warning', icon: 'mdi:alert' },
  MEDIUM: { color: 'info', icon: 'mdi:alert-circle-outline' },
  LOW: { color: 'success', icon: 'mdi:information-outline' },
};

const RecentAlerts = (): ReactElement => {
  const { recentAlerts } = useDashboardSnapshot();

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: 4, py: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" color="text.primary" fontWeight={600}>
          Cảnh báo gần đây
        </Typography>
        <Chip
          label={`${recentAlerts.length} cảnh báo`}
          size="small"
          color="info"
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
      </Box>
      <Box sx={{ p: 3, maxHeight: 380, overflow: 'auto' }}>
        <Stack gap={2}>
          {recentAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            return (
              <Box
                key={alert.id}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'background.default',
                  borderLeft: `3px solid`,
                  borderColor: `${config.color}.main`,
                }}
              >
                <Stack direction="row" alignItems="center" gap={2} mb={1.5}>
                  <IconifyIcon icon={config.icon} width={16} height={16} color={`${config.color}.main`} />
                  <Typography variant="body2" color="text.primary" fontWeight={600} flex={1}>
                    {alert.title}
                  </Typography>
                  <Chip
                    label={alert.severity}
                    size="small"
                    color={config.color}
                    sx={{ fontWeight: 700, fontSize: '0.6rem', height: 20 }}
                  />
                </Stack>
                <Typography variant="caption" color="text.disabled" display="block" mb={1.5}>
                  {alert.description}
                </Typography>
                <Stack direction="row" gap={3} flexWrap="wrap">
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <IconifyIcon icon="mdi:clock-outline" width={12} height={12} color="text.disabled" />
                    <Typography variant="caption" color="text.disabled">{alert.timestamp}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <IconifyIcon icon="mdi:source-branch" width={12} height={12} color="text.disabled" />
                    <Typography variant="caption" color="text.disabled">{alert.source}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <IconifyIcon icon="mdi:lightning-bolt" width={12} height={12} color="primary.main" />
                    <Typography variant="caption" color="primary.main">{alert.action}</Typography>
                  </Stack>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Paper>
  );
};

export default RecentAlerts;
