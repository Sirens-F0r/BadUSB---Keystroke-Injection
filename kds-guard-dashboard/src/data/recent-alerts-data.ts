// KDS Guard – Recent alerts mock data

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertItem {
  id: number;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  action: string;
  source: string;
}

export const recentAlertsData: AlertItem[] = [
  {
    id: 1,
    severity: 'CRITICAL',
    title: 'Phát hiện tấn công BadUSB',
    description: 'Nhiều luật phát hiện được kích hoạt đồng thời. Input đã bị chặn và thiết bị đã được cô lập.',
    timestamp: '2026-04-04 23:45',
    action: 'Soft Block',
    source: 'Detector',
  },
  {
    id: 2,
    severity: 'HIGH',
    title: 'Tốc độ gõ bất thường',
    description: 'Tốc độ gõ vượt ngưỡng 15 phím/giây trên thiết bị HID đang kết nối.',
    timestamp: '2026-04-05 10:24',
    action: 'Challenge',
    source: 'Rule Engine',
  },
  {
    id: 3,
    severity: 'MEDIUM',
    title: 'Sử dụng phím Modifier bất thường',
    description: 'Tỷ lệ Modifier tăng đột biến lên 42% trong cửa sổ phân tích.',
    timestamp: '2026-04-05 09:12',
    action: 'Alert',
    source: 'Feature Extractor',
  },
  {
    id: 4,
    severity: 'LOW',
    title: 'Thiết bị USB mới kết nối',
    description: 'Thiết bị HID không xác định được kết nối. Đã bật chế độ giám sát nâng cao.',
    timestamp: '2026-04-05 10:18',
    action: 'Log Only',
    source: 'Device Monitor',
  },
];
