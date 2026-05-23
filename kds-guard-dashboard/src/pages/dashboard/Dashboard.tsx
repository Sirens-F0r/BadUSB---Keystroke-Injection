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
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
        {/* Row 1: Risk Score + Threat Level */}
        <Box gridColumn={{ xs: 'span 12', md: 'span 6' }} order={{ xs: 0 }}>
          <RiskScore />
        </Box>
        <Box gridColumn={{ xs: 'span 12', md: 'span 6' }} order={{ xs: 1 }}>
          <ThreatLevel />
        </Box>

        {/* Row 2: Detection Rules Table */}
        <Box gridColumn={{ xs: 'span 12', lg: 'span 8' }} order={{ xs: 2 }}>
          <DetectionRules />
        </Box>

        {/* Row 2 Right: Keystroke Metrics Comparison */}
        <Box gridColumn={{ xs: 'span 12', lg: 'span 4' }} order={{ xs: 3 }}>
          <KeystrokeMetrics />
        </Box>

        {/* Row 3: Activity Timeline */}
        <Box gridColumn={{ xs: 'span 12', xl: 'span 8' }} order={{ xs: 4 }}>
          <ActivityTimeline />
        </Box>

        {/* Row 3 Right: Recent Alerts */}
        <Box gridColumn={{ xs: 'span 12', xl: 'span 4' }} order={{ xs: 5 }}>
          <RecentAlerts />
        </Box>

        {/* Row 4: Event Log Table */}
        <Box gridColumn={{ xs: 'span 12' }} order={{ xs: 6 }}>
          <EventLog />
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
