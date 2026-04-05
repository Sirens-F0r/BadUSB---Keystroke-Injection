// KDS Guard – Policies Page

import { ReactElement } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface PolicyLevel {
  id: number;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  color: 'success' | 'info' | 'warning' | 'error';
  actions: string[];
}

const policyLevels: PolicyLevel[] = [
  {
    id: 1, name: 'Allow',
    description: 'No action taken. Input passes through normally. Used when risk score is below threshold.',
    icon: 'mdi:check-circle-outline', active: true, color: 'success',
    actions: ['Continue monitoring', 'Log event', 'No user notification'],
  },
  {
    id: 2, name: 'Log Only',
    description: 'Event is logged for analysis. No blocking occurs. Used for low-risk anomalies.',
    icon: 'mdi:file-document-outline', active: true, color: 'info',
    actions: ['Record full event details', 'Save keystroke metrics', 'Add to event history'],
  },
  {
    id: 3, name: 'Alert',
    description: 'User notification is displayed. Monitoring is enhanced. Used for medium-risk detections.',
    icon: 'mdi:bell-alert-outline', active: true, color: 'warning',
    actions: ['Display system notification', 'Increase monitoring frequency', 'Log with high priority'],
  },
  {
    id: 4, name: 'Soft Block',
    description: 'Input is temporarily suspended. Device is flagged. Used for high-risk attacks.',
    icon: 'mdi:shield-lock-outline', active: true, color: 'error',
    actions: ['Suspend keyboard input', 'Flag device as suspicious', 'Require manual approval'],
  },
  {
    id: 5, name: 'Challenge',
    description: 'User must verify identity via challenge question or pattern. Used to distinguish human vs bot.',
    icon: 'mdi:account-question-outline', active: false, color: 'warning',
    actions: ['Display verification prompt', 'Pause input processing', 'Evaluate response pattern'],
  },
];

const PoliciesPage = (): ReactElement => {
  return (
    <>
      <Typography variant="h4" color="common.white" mb={1}>Response Policies</Typography>
      <Typography variant="body2" color="text.disabled" mb={6}>
        Define how KDS Guard responds when threats are detected. Policies are applied based on the composite risk score and number of triggered rules.
      </Typography>

      <Paper sx={{ p: 5, mb: 4 }}>
        <Typography variant="h6" color="common.white" mb={3}>Current Active Policy</Typography>
        <Stack direction="row" gap={3} flexWrap="wrap">
          <Stack gap={1}>
            <Typography variant="caption" color="text.disabled">Active Level</Typography>
            <Chip label="ALLOW" color="success" sx={{ fontWeight: 700 }} />
          </Stack>
          <Stack gap={1}>
            <Typography variant="caption" color="text.disabled">Risk Score</Typography>
            <Typography variant="body1" color="success.main" fontFamily="monospace" fontWeight={700}>0.12</Typography>
          </Stack>
          <Stack gap={1}>
            <Typography variant="caption" color="text.disabled">Last Action</Typography>
            <Typography variant="body1" color="text.secondary">Continue Monitoring</Typography>
          </Stack>
          <Stack gap={1}>
            <Typography variant="caption" color="text.disabled">Last Updated</Typography>
            <Typography variant="body1" color="text.secondary">10:24 AM</Typography>
          </Stack>
        </Stack>
      </Paper>

      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
        {policyLevels.map((policy) => (
          <Box key={policy.id} gridColumn={{ xs: 'span 12', md: 'span 6' }}>
            <Paper sx={{ p: 5, height: 1, borderLeft: '3px solid', borderColor: `${policy.color}.main`, opacity: policy.active ? 1 : 0.5 }}>
              <Stack direction="row" alignItems="center" gap={2} mb={3}>
                <IconifyIcon icon={policy.icon} width={28} height={28} color={`${policy.color}.main`} />
                <Typography variant="h6" color="common.white" flex={1}>{policy.name}</Typography>
                <Chip label={policy.active ? 'ENABLED' : 'DISABLED'} size="small" color={policy.active ? 'success' : 'default'} sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
              </Stack>
              <Typography variant="body2" color="text.disabled" mb={3}>{policy.description}</Typography>
              <Typography variant="caption" color="text.disabled" mb={1.5} display="block">Actions:</Typography>
              <Stack gap={1}>
                {policy.actions.map((action, idx) => (
                  <Stack key={idx} direction="row" alignItems="center" gap={1}>
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: `${policy.color}.main` }} />
                    <Typography variant="caption" color="text.secondary">{action}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Box>
        ))}
      </Box>
    </>
  );
};

export default PoliciesPage;
