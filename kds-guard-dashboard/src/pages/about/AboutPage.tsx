// KDS Guard – About Page

import { ReactElement } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

const pipelineSteps = [
  { icon: 'mdi:keyboard', name: 'Collector', description: 'Captures raw keystroke events (key press/release timestamps) from the OS via low-level hooks.', color: 'info.main' },
  { icon: 'mdi:file-document-outline', name: 'Logger', description: 'Records keystroke timing data (flight time, hold time) and maintains sliding analysis windows.', color: 'primary.main' },
  { icon: 'mdi:function-variant', name: 'Feature Extractor', description: 'Computes behavioral features: mean/CV flight time, typing speed, burst length, modifier ratio, IQR hold time.', color: 'warning.main' },
  { icon: 'mdi:target', name: 'Detector', description: 'Rule-based engine that evaluates 8 detection rules against computed features and produces a composite risk score.', color: 'error.main' },
  { icon: 'mdi:shield-lock-outline', name: 'Policy Engine', description: 'Determines response action (Allow/Log/Alert/Soft Block/Challenge) based on risk score and triggered rules.', color: 'success.main' },
];

const AboutPage = (): ReactElement => {
  return (
    <>
      <Typography variant="h4" color="common.white" mb={1}>About KDS Guard</Typography>
      <Typography variant="body2" color="text.disabled" mb={6}>
        Keystroke Dynamics Security Guard – BadUSB Detection & Protection Tool
      </Typography>

      <Paper sx={{ p: 5, mb: 4 }}>
        <Typography variant="h6" color="common.white" mb={3}>System Overview</Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          KDS Guard is a security monitoring tool that detects BadUSB attacks by analyzing keystroke dynamics.
          Unlike traditional USB security tools that rely on device whitelisting or driver signatures,
          KDS Guard focuses on <strong style={{ color: '#A9DFD8' }}>behavioral analysis</strong> –
          the way keys are typed rather than what device is connected.
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          A BadUSB attack works by impersonating a keyboard (HID device) and injecting pre-programmed keystrokes
          at inhuman speeds. KDS Guard detects this by monitoring timing patterns that distinguish human typing
          from automated injection.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The system uses a <strong style={{ color: '#A9DFD8' }}>rule-based detection engine</strong> with
          7 behavioral rules, each monitoring a specific keystroke metric.
        </Typography>
      </Paper>

      <Paper sx={{ p: 5, mb: 4 }}>
        <Typography variant="h6" color="common.white" mb={4}>System Architecture – Detection Pipeline</Typography>
        <Stack gap={0}>
          {pipelineSteps.map((step, index) => (
            <Box key={step.name}>
              <Stack direction="row" alignItems="flex-start" gap={3}>
                <Stack alignItems="center">
                  <Box sx={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: step.color, flexShrink: 0 }}>
                    <IconifyIcon icon={step.icon} width={24} height={24} color="common.white" />
                  </Box>
                  {index < pipelineSteps.length - 1 && <Box sx={{ width: 2, height: 40, bgcolor: 'divider' }} />}
                </Stack>
                <Box pt={1}>
                  <Typography variant="body1" color="common.white" fontWeight={700} mb={0.5}>{step.name}</Typography>
                  <Typography variant="body2" color="text.disabled">{step.description}</Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 5, mb: 4 }}>
        <Typography variant="h6" color="common.white" mb={3}>Detection Principle</Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>Human typing exhibits natural variability in timing patterns:</Typography>
        <Stack gap={1.5} ml={2} mb={3}>
          <Typography variant="body2" color="text.secondary">• <strong>Flight time</strong>: Time between releasing one key and pressing the next (typically 80–200ms)</Typography>
          <Typography variant="body2" color="text.secondary">• <strong>Hold time</strong>: Duration a key is held down (typically 50–150ms)</Typography>
          <Typography variant="body2" color="text.secondary">• <strong>Variability</strong>: Human typing has natural variance (CV {'>'} 0.3), automated input is uniform</Typography>
          <Typography variant="body2" color="text.secondary">• <strong>Speed</strong>: Human typing rarely exceeds 10 keys/s, BadUSB can inject 20+ keys/s</Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          By measuring these behavioral features across analysis windows and applying rule-based thresholds,
          KDS Guard can distinguish human from automated input with high confidence.
        </Typography>
      </Paper>

      <Paper sx={{ p: 5 }}>
        <Typography variant="h6" color="common.white" mb={3}>Future Development</Typography>
        <Stack gap={1.5}>
          <Typography variant="body2" color="text.secondary">• Machine Learning integration for adaptive threshold learning</Typography>
          <Typography variant="body2" color="text.secondary">• User profiling to personalize detection for individual typing patterns</Typography>
          <Typography variant="body2" color="text.secondary">• Network-based deployment for enterprise endpoint protection</Typography>
          <Typography variant="body2" color="text.secondary">• Integration with Windows Device Guard and Group Policy</Typography>
          <Typography variant="body2" color="text.secondary">• Real-time dashboard with WebSocket backend for multi-device monitoring</Typography>
        </Stack>
      </Paper>
    </>
  );
};

export default AboutPage;
