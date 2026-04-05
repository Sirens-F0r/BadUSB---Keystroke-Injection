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
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
        {/* Row 1: System Overview Cards (full width) */}
        <Box gridColumn={{ xs: 'span 12', '2xl': 'span 8' }} order={{ xs: 0 }}>
          <SystemOverview />
        </Box>

        {/* Row 1 Right: Risk Score */}
        <Box gridColumn={{ xs: 'span 12', lg: 'span 4' }} order={{ xs: 1, '2xl': 1 }}>
          <RiskScore />
        </Box>

        {/* Row 2: Detection Rules Table */}
        <Box gridColumn={{ xs: 'span 12', lg: 'span 8' }} order={{ xs: 2, '2xl': 2 }}>
          <DetectionRules />
        </Box>

        {/* Row 2 Right: Keystroke Metrics Comparison */}
        <Box
          gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}
          order={{ xs: 3, xl: 3, '2xl': 3 }}
        >
          <KeystrokeMetrics />
        </Box>

        {/* Row 3 Left: Threat Level Gauge */}
        <Box
          gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}
          order={{ xs: 4, xl: 5, '2xl': 4 }}
        >
          <ThreatLevel />
        </Box>

        {/* Row 3: Activity Timeline */}
        <Box gridColumn={{ xs: 'span 12', xl: 'span 8' }} order={{ xs: 5, xl: 4, '2xl': 5 }}>
          <ActivityTimeline />
        </Box>

        {/* Row 4: Recent Alerts */}
        <Box
          gridColumn={{ xs: 'span 12', xl: 'span 8', '2xl': 'span 6' }}
          order={{ xs: 6, '2xl': 6 }}
        >
          <RecentAlerts />
        </Box>

        {/* Row 4: Event Log Table */}
        <Box gridColumn={{ xs: 'span 12', '2xl': 'span 6' }} order={{ xs: 7 }}>
          <EventLog />
        </Box>
      </Box>
    </>
  );
};

export default Dashboard;
