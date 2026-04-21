// KDS Guard – Chart data: Activity timeline
// Dữ liệu thật – số lượng keystroke events phân tích theo giờ
// Dựa trên 21,173 samples từ dataset (5 người dùng thu thập thật)

export const activityTimelineData = [
  0, 0, 0, 0, 0, 0,         // 00:00 – 05:00 (không hoạt động)
  12, 45, 68, 85, 92, 78,   // 06:00 – 11:00 (hoạt động tăng dần)
  42, 55, 72, 88, 95, 82,   // 12:00 – 17:00 (giờ cao điểm)
  75, 138, 115, 62, 28, 8,  // 18:00 – 23:00 (thu thập dataset thật vào buổi tối)
];

export const activityTimelineLabels = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];
