// KDS Guard – System overview mock data
// Các metric tổng quan hiển thị trên Dashboard

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
export const currentRiskScore = 0.12;
export const lastUpdated = '2026-04-05T10:24:00';

const systemOverviewData: SystemMetric[] = [
  {
    id: 1,
    icon: 'mdi:shield-check',
    value: 'AN TOÀN',
    label: 'Trạng thái hệ thống',
    description: 'Tất cả bình thường',
    color: 'success.main',
  },
  {
    id: 2,
    icon: 'mdi:alert-circle-outline',
    value: '4',
    label: 'Sự kiện nghi vấn',
    description: 'Phát hiện hôm nay',
    color: 'warning.main',
  },
  {
    id: 3,
    icon: 'mdi:shield-off-outline',
    value: '2',
    label: 'Tấn công đã chặn',
    description: 'Trong 24 giờ qua',
    color: 'error.main',
  },
  {
    id: 4,
    icon: 'mdi:usb',
    value: '1',
    label: 'Thiết bị HID',
    description: 'Đang kết nối',
    color: 'info.main',
  },
];

export default systemOverviewData;
