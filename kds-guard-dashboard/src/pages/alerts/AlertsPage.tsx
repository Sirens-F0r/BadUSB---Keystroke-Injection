// KDS Guard – Alerts Page
// Trung tâm cảnh báo

import { ReactElement } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { recentAlertsData, AlertSeverity } from 'data/recent-alerts-data';

const severityConfig: Record<AlertSeverity, { color: 'error' | 'warning' | 'info' | 'success'; icon: string; bg: string }> = {
  CRITICAL: { color: 'error', icon: 'mdi:alert-octagon', bg: 'rgba(255, 0, 60, 0.08)' },
  HIGH: { color: 'warning', icon: 'mdi:alert', bg: 'rgba(252, 184, 89, 0.08)' },
  MEDIUM: { color: 'info', icon: 'mdi:alert-circle-outline', bg: 'rgba(32, 174, 243, 0.08)' },
  LOW: { color: 'success', icon: 'mdi:information-outline', bg: 'rgba(0, 146, 126, 0.08)' },
};

const AlertsPage = (): ReactElement => {
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Typography variant="h4" color="common.white" mb={1}>
            Alert Center
          </Typography>
          <Typography variant="body2" color="text.disabled">
            All security alerts and notifications from KDS Guard monitoring system
          </Typography>
        </Box>
        <Stack direction="row" gap={2}>
          <Chip label="CRITICAL: 1" size="small" color="error" sx={{ fontWeight: 700 }} />
          <Chip label="HIGH: 1" size="small" color="warning" sx={{ fontWeight: 700 }} />
          <Chip label="MEDIUM: 1" size="small" color="info" sx={{ fontWeight: 700 }} />
          <Chip label="LOW: 1" size="small" color="success" sx={{ fontWeight: 700 }} />
        </Stack>
      </Stack>

      <Stack gap={3}>
        {recentAlertsData.map((alert) => {
          const config = severityConfig[alert.severity];
          return (
            <Paper key={alert.id} sx={{ p: 6, bgcolor: config.bg }}>
              <Stack direction="row" alignItems="flex-start" gap={3}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${config.color}.main`,
                    flexShrink: 0,
                  }}
                >
                  <IconifyIcon icon={config.icon} width={28} height={28} color="common.white" />
                </Box>
                <Box flex={1}>
                  <Stack direction="row" alignItems="center" gap={2} mb={1.5}>
                    <Typography variant="h6" color="common.white">
                      {alert.title}
                    </Typography>
                    <Chip
                      label={alert.severity}
                      size="small"
                      color={config.color}
                      sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    />
                  </Stack>
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    {alert.description}
                  </Typography>
                  <Stack direction="row" gap={4} flexWrap="wrap">
                    <Stack direction="row" alignItems="center" gap={1}>
                      <IconifyIcon icon="mdi:clock-outline" width={14} height={14} color="text.disabled" />
                      <Typography variant="caption" color="text.disabled">{alert.timestamp}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <IconifyIcon icon="mdi:source-branch" width={14} height={14} color="text.disabled" />
                      <Typography variant="caption" color="text.disabled">Source: {alert.source}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <IconifyIcon icon="mdi:lightning-bolt" width={14} height={14} color="primary.main" />
                      <Typography variant="caption" color="primary.main">Action: {alert.action}</Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </>
  );
};

export default AlertsPage;
