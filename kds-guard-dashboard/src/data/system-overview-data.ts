// KDS Guard – System overview data
// Dữ liệu thật từ evaluation_report.json (19/04/2026)
// Dataset: 21,173 samples | 5 người dùng thật | 232 injection samples

export type SystemStatus = 'SAFE' | 'WARNING' | 'ATTACK';
export type StatusColor = 'success.main' | 'warning.main' | 'error.main' | 'info.main';

export interface SystemMetric {
  id: number;
  icon: string;
  value: string;
  label: string;
  description: string;
  color: StatusColor;
}

export const currentSystemStatus: SystemStatus = 'SAFE';
export const currentRiskScore = 0.04;
export const lastUpdated = '2026-04-19T19:43:08';

const systemOverviewData: SystemMetric[] = [
  {
    id: 1,
    icon: 'mdi:shield-check',
    value: 'AN TOÀN',
    label: 'Trạng thái hệ thống',
    description: 'Tất cả bình thường – F1=1.00',
    color: 'success.main',
  },
  {
    id: 2,
    icon: 'mdi:account-group',
    value: '5',
    label: 'Người dùng đã thu thập',
    description: '138 feature vectors từ dữ liệu thật',
    color: 'info.main',
  },
  {
    id: 3,
    icon: 'mdi:shield-off-outline',
    value: '232',
    label: 'Tấn công đã phát hiện',
    description: '100% Recall – 0 False Negative',
    color: 'error.main',
  },
  {
    id: 4,
    icon: 'mdi:database-check',
    value: '21,173',
    label: 'Tổng mẫu phân tích',
    description: '20,941 human + 232 injection',
    color: 'info.main',
  },
];

export default systemOverviewData;
