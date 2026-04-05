// KDS Guard – Settings Page

import { ReactElement } from 'react';
import { Box, Button, Chip, Paper, Slider, Stack, Switch, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useWindowsNotification } from 'hooks/useWindowsNotification';

const toggleSettings = [
  { id: 'realtime', label: 'Giám sát thời gian thực', description: 'Liên tục giám sát động học gõ phím để phát hiện bất thường', enabled: true },
  { id: 'soft_block', label: 'Chặn input khi bị tấn công', description: 'Tự động tạm dừng nhập liệu khi phát hiện tấn công', enabled: true },
  { id: 'challenge', label: 'Chế độ xác minh', description: 'Yêu cầu xác minh danh tính khi điểm rủi ro vượt ngưỡng', enabled: false },
  { id: 'auto_log', label: 'Ghi log tự động', description: 'Ghi lại tất cả sự kiện và kết quả phân tích', enabled: true },
  { id: 'enhanced', label: 'Giám sát nâng cao thiết bị mới', description: 'Tăng tần suất phân tích khi có thiết bị HID mới kết nối', enabled: true },
  { id: 'notifications', label: 'Thông báo hệ thống', description: 'Hiển thị thông báo cho các cảnh báo bảo mật', enabled: true },
];

const thresholdSettings = [
  { id: 'risk', label: 'Ngưỡng cảnh báo rủi ro', min: 0, max: 1, value: 0.5, unit: '', step: 0.05 },
  { id: 'window', label: 'Kích thước cửa sổ phân tích', min: 50, max: 500, value: 250, unit: ' phím', step: 50 },
  { id: 'rules', label: 'Số luật tối thiểu để cảnh báo', min: 1, max: 7, value: 2, unit: ' luật', step: 1 },
  { id: 'block', label: 'Ngưỡng tự động chặn', min: 0, max: 1, value: 0.85, unit: '', step: 0.05 },
];

const SettingsPage = (): ReactElement => {
  const { state: notifState, requestPermission, sendTestNotification } = useWindowsNotification();

  return (
    <>
      <Typography variant="h4" color="common.white" mb={1}>Cài đặt</Typography>
      <Typography variant="body2" color="text.disabled" mb={6}>
        Cấu hình hành vi giám sát, ngưỡng phát hiện và phản hồi của KDS Guard
      </Typography>

      {/* Windows Notification Section */}
      <Paper sx={{ p: 5, mb: 4, borderLeft: '3px solid', borderColor: 'info.main' }}>
        <Stack direction="row" alignItems="center" gap={2} mb={3}>
          <IconifyIcon icon="mdi:bell-ring-outline" width={28} height={28} color="info.main" />
          <Typography variant="h6" color="common.white">Thông báo Windows</Typography>
          <Chip
            label={notifState.permission === 'granted' ? 'ENABLED' : notifState.permission === 'denied' ? 'BLOCKED' : 'NOT SET'}
            size="small"
            color={notifState.permission === 'granted' ? 'success' : notifState.permission === 'denied' ? 'error' : 'warning'}
            sx={{ fontWeight: 700, fontSize: '0.65rem' }}
          />
        </Stack>
        <Typography variant="body2" color="text.disabled" mb={3}>
          Hiển thị thông báo trực tiếp trên Windows khi phát hiện USB có hành vi bất thường (risk score ≥ 30%).
          Notification sẽ xuất hiện trên thanh taskbar giống như thông báo hệ thống.
        </Typography>

        <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
          {notifState.permission !== 'granted' && (
            <Button
              variant="contained"
              color="info"
              startIcon={<IconifyIcon icon="mdi:bell-plus-outline" />}
              onClick={requestPermission}
              size="small"
            >
              Bật Notification
            </Button>
          )}
          <Button
            variant="outlined"
            color="warning"
            startIcon={<IconifyIcon icon="mdi:bell-alert-outline" />}
            onClick={sendTestNotification}
            size="small"
            disabled={notifState.permission !== 'granted'}
          >
            Test Notification
          </Button>
          <Typography variant="caption" color="text.disabled">
            Đã gửi: {notifState.totalSent} notification
            {notifState.lastNotificationTime && (
              <> · Lần cuối: {new Date(notifState.lastNotificationTime).toLocaleTimeString('vi-VN')}</>
            )}
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 5, mb: 4 }}>
        <Typography variant="h6" color="common.white" mb={4}>Giám sát & Phản hồi</Typography>
        <Stack gap={3}>
          {toggleSettings.map((s) => (
            <Stack key={s.id} direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body1" color="common.white">{s.label}</Typography>
                <Typography variant="caption" color="text.disabled">{s.description}</Typography>
              </Box>
              <Switch defaultChecked={s.enabled} color="primary" />
            </Stack>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 5 }}>
        <Typography variant="h6" color="common.white" mb={4}>Ngưỡng phát hiện</Typography>
        <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={4}>
          {thresholdSettings.map((t) => (
            <Box key={t.id} gridColumn={{ xs: 'span 12', md: 'span 6' }}>
              <Stack gap={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="common.white">{t.label}</Typography>
                  <Typography variant="body2" color="primary.main" fontFamily="monospace" fontWeight={700}>
                    {t.value}{t.unit}
                  </Typography>
                </Stack>
                <Slider defaultValue={t.value} min={t.min} max={t.max} step={t.step} color="primary"
                  sx={{ '& .MuiSlider-thumb': { width: 16, height: 16 } }} />
              </Stack>
            </Box>
          ))}
        </Box>
      </Paper>
    </>
  );
};

export default SettingsPage;
