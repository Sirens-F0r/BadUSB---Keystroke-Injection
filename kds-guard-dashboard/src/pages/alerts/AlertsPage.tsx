// KDS Guard – Alerts Page

import { ReactElement, useMemo } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import type { AlertSeverity } from 'data/recent-alerts-data';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';

const severityConfig: Record<AlertSeverity, { color: 'error' | 'warning' | 'info' | 'success'; icon: string }> = {
  CRITICAL: { color: 'error', icon: 'mdi:alert-octagon' },
  HIGH: { color: 'warning', icon: 'mdi:alert' },
  MEDIUM: { color: 'info', icon: 'mdi:alert-circle-outline' },
  LOW: { color: 'success', icon: 'mdi:information-outline' },
};

const AlertsPage = (): ReactElement => {
  const { recentAlerts } = useDashboardSnapshot();

  const severityCounts = useMemo(() => {
    const c = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    recentAlerts.forEach((a) => { c[a.severity] += 1; });
    return c;
  }, [recentAlerts]);

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={3}>
        <Box>
          <Typography variant="h4" color="text.primary" mb={1}>Alert Center</Typography>
          <Typography variant="body2" color="text.disabled">All security alerts and notifications</Typography>
        </Box>
        <Stack direction="row" gap={1.5} flexWrap="wrap">
          <Chip label={`CRITICAL: ${severityCounts.CRITICAL}`} size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
          <Chip label={`HIGH: ${severityCounts.HIGH}`} size="small" color="warning" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
          <Chip label={`MEDIUM: ${severityCounts.MEDIUM}`} size="small" color="info" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
          <Chip label={`LOW: ${severityCounts.LOW}`} size="small" color="success" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
        </Stack>
      </Stack>

      <Stack gap={2}>
        {recentAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          return (
            <Paper key={alert.id} sx={{ p: 3, borderRadius: 2, borderLeft: '3px solid', borderColor: `${config.color}.main` }}>
              <Stack direction="row" alignItems="flex-start" gap={2}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${config.color}.main`, flexShrink: 0 }}>
                  <IconifyIcon icon={config.icon} width={22} height={22} color="text.primary" />
                </Box>
                <Box flex={1}>
                  <Stack direction="row" alignItems="center" gap={2} mb={1}>
                    <Typography variant="body1" color="text.primary" fontWeight={600}>{alert.title}</Typography>
                    <Chip label={alert.severity} size="small" color={config.color} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>{alert.description}</Typography>
                  <Stack direction="row" gap={3} flexWrap="wrap">
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <IconifyIcon icon="mdi:clock-outline" width={12} height={12} color="text.disabled" />
                      <Typography variant="caption" color="text.disabled">{alert.timestamp}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <IconifyIcon icon="mdi:source-branch" width={12} height={12} color="text.disabled" />
                      <Typography variant="caption" color="text.disabled">Source: {alert.source}</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <IconifyIcon icon="mdi:lightning-bolt" width={12} height={12} color="primary.main" />
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
