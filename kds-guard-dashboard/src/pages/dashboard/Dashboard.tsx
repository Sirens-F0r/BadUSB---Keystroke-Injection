// KDS Guard – Main Dashboard Page
// Tổng quan bảo mật hệ thống

import { ReactElement } from 'react';
import { Box } from '@mui/material';

import SystemOverview from 'components/sections/dashboard/system-overview/SystemOverview';
import RiskScore from 'components/sections/dashboard/risk-score/RiskScore';
import DetectionRules from 'components/sections/dashboard/detection-rules/DetectionRules';
import KeystrokeMetrics from 'components/sections/dashboard/keystroke-metrics/KeystrokeMetrics';
import ThreatLevel from 'components/sections/dashboard/threat-level/ThreatLevel';
import ActivityTimeline from 'components/sections/dashboard/activity-timeline/ActivityTimeline';
import RecentAlerts from 'components/sections/dashboard/recent-alerts/RecentAlerts';
import EventLog from 'components/sections/dashboard/event-log/EventLog';

const Dashboard = (): ReactElement => {
  return (
    <>
      <SystemOverview />
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
        {/* Row 1: Risk Score (wider) + Threat Level (narrower) */}
        <Box gridColumn={{ xs: 'span 12', md: 'span 7' }}>
          <RiskScore />
        </Box>
        <Box gridColumn={{ xs: 'span 12', md: 'span 5' }}>
          <ThreatLevel />
        </Box>

        {/* Row 2: Detection Rules + Keystroke Metrics */}
        <Box gridColumn={{ xs: 'span 12', lg: 'span 7' }}>
          <DetectionRules />
        </Box>
        <Box gridColumn={{ xs: 'span 12', lg: 'span 5' }}>
          <KeystrokeMetrics />
        </Box>

        {/* Row 3: Activity Timeline + Recent Alerts */}
        <Box gridColumn={{ xs: 'span 12', lg: 'span 8' }}>
          <ActivityTimeline />
        </Box>
        <Box gridColumn={{ xs: 'span 12', lg: 'span 4' }}>
          <RecentAlerts />
        </Box>

        {/* Row 4: Event Log (full width) */}
        <Box gridColumn="span 12">
          <EventLog />
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
