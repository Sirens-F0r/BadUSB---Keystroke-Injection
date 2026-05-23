import type { SystemMetric } from 'data/system-overview-data';
import type { GridRowsProp } from '@mui/x-data-grid';
import type { AlertItem } from 'data/recent-alerts-data';

export interface DashboardSnapshot {
  generated_at: string;
  systemOverview: {
    metrics: SystemMetric[];
    currentRiskScore: number;
    lastUpdated: string;
    threatLevel: string;
    threatDescription: string;
  };
  keystrokeMetrics: Record<string, number[]>;
  activityTimeline: {
    values: number[];
    labels: string[];
  };
  riskScore: {
    history: number[];
    labels: string[];
  };
  recentAlerts: AlertItem[];
  eventLogRows: GridRowsProp;
  gaugeValue: number;
}
