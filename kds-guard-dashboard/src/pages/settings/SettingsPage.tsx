// KDS Guard – Settings Page
// Cấu hình giám sát, ngưỡng phát hiện, phản hồi + system info

import { ReactElement, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useWindowsNotification } from 'hooks/useWindowsNotification';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';

// --- Toggle settings ---
const toggleSettings = [
  { id: 'realtime', icon: 'mdi:monitor-eye', label: 'Giám sát thời gian thực', desc: 'Liên tục giám sát động học gõ phím để phát hiện bất thường', on: true },
  { id: 'soft_block', icon: 'mdi:shield-lock-outline', label: 'Chặn input khi bị tấn công', desc: 'Tự động tạm dừng nhập liệu khi phát hiện tấn công', on: true },
  { id: 'challenge', icon: 'mdi:account-check-outline', label: 'Chế độ xác minh', desc: 'Yêu cầu xác minh danh tính khi điểm rủi ro vượt ngưỡng', on: false },
  { id: 'auto_log', icon: 'mdi:file-document-edit-outline', label: 'Ghi log tự động', desc: 'Ghi lại tất cả sự kiện và kết quả phân tích', on: true },
  { id: 'enhanced', icon: 'mdi:usb-flash-drive-outline', label: 'Giám sát nâng cao thiết bị mới', desc: 'Tăng tần suất phân tích khi có thiết bị HID mới kết nối', on: true },
  { id: 'notifications', icon: 'mdi:bell-outline', label: 'Thông báo hệ thống', desc: 'Hiển thị thông báo cho các cảnh báo bảo mật', on: true },
];

// --- Threshold settings ---
const thresholdSettings = [
  { id: 'risk', label: 'Ngưỡng cảnh báo rủi ro', min: 0, max: 1, value: 0.5, unit: '', step: 0.05, icon: 'mdi:alert-circle-outline' },
  { id: 'window', label: 'Kích thước cửa sổ phân tích', min: 50, max: 500, value: 250, unit: ' phím', step: 50, icon: 'mdi:keyboard-outline' },
  { id: 'rules', label: 'Số luật tối thiểu cảnh báo', min: 1, max: 7, value: 2, unit: ' luật', step: 1, icon: 'mdi:gavel' },
  { id: 'block', label: 'Ngưỡng tự động chặn', min: 0, max: 1, value: 0.85, unit: '', step: 0.05, icon: 'mdi:hand-back-left-off-outline' },
];

// --- Engine info ---
const engineRows = [
  { label: 'Engine version', value: 'KDS Guard v1.0.0' },
  { label: 'Detection rules', value: '8 luật' },
  { label: 'ML Model', value: 'RandomForest' },
  { label: 'Features', value: '7 features/window' },
  { label: 'Collector', value: 'Rust low-level hook' },
  { label: 'Dashboard', value: 'React + MUI + Vite' },
  { label: 'Bridge', value: 'ws://localhost:8765' },
];

// --- Protection modules ---
const protectionModules = [
  { label: 'Rule-based Detection', pct: 100, color: 'success' as const },
  { label: 'ML Model (RandomForest)', pct: 95, color: 'success' as const },
  { label: 'Realtime WebSocket', pct: 80, color: 'warning' as const },
  { label: 'Auto-Block Response', pct: 100, color: 'success' as const },
];

/* ───── Reusable section-header icon box ───── */
const SectionIcon = ({ icon, bgcolor }: { icon: string; bgcolor: string }) => (
  <Box
    sx={{
      width: 36, height: 36, borderRadius: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor, color: 'common.white', flexShrink: 0,
    }}
  >
    <IconifyIcon icon={icon} width={20} height={20} />
  </Box>
);

const SettingsPage = (): ReactElement => {
  const { state: notifState, requestPermission, sendTestNotification } = useWindowsNotification();
  const snap = useDashboardSnapshot();

  const alertCounts = useMemo(() => {
    const a = snap.recentAlerts ?? [];
    return { total: a.length, critical: a.filter((x) => x.severity === 'CRITICAL').length, high: a.filter((x) => x.severity === 'HIGH').length };
  }, [snap.recentAlerts]);

  const notifPct = notifState.permission === 'granted' ? 100 : 0;

  return (
    <>
      {/* ── Page header ── */}
      <Typography variant="h4" color="text.primary" mb={1}>Cài đặt</Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Cấu hình hành vi giám sát, ngưỡng phát hiện và phản hồi của KDS Guard
      </Typography>

      {/* ══════════════════════════════════════════════════════
          ROW 1 – Status overview cards  (3 cột ngang)
         ══════════════════════════════════════════════════════ */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }}
        gap={3}
        mb={4}
      >
        {/* Threat level */}
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <SectionIcon icon="mdi:shield-outline" bgcolor="success.main" />
          <Box flex={1} minWidth={0}>
            <Typography variant="caption" color="text.secondary">Mức đe doạ</Typography>
            <Typography variant="h6" color="text.primary" fontFamily="monospace" noWrap>
              {snap.systemOverview.threatLevel}
            </Typography>
          </Box>
          <Chip
            label={`${Math.round(snap.gaugeValue)}%`}
            size="small"
            color={snap.gaugeValue > 50 ? 'error' : snap.gaugeValue > 20 ? 'warning' : 'success'}
            sx={{ fontWeight: 700 }}
          />
        </Paper>

        {/* Risk score */}
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <SectionIcon icon="mdi:chart-line" bgcolor="primary.main" />
          <Box flex={1} minWidth={0}>
            <Typography variant="caption" color="text.secondary">Điểm rủi ro</Typography>
            <Typography variant="h6" color="text.primary" fontFamily="monospace">
              {snap.systemOverview.currentRiskScore.toFixed(2)}
            </Typography>
          </Box>
        </Paper>

        {/* Alert counts */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" gap={2} mb={1}>
            <SectionIcon icon="mdi:alert-decagram-outline" bgcolor="warning.main" />
            <Typography variant="caption" color="text.secondary" flex={1}>Cảnh báo gần đây</Typography>
            <Typography variant="h6" color="text.primary" fontFamily="monospace">{alertCounts.total}</Typography>
          </Stack>
          <Stack direction="row" gap={1}>
            <Chip label={`Critical: ${alertCounts.critical}`} size="small" color="error" sx={{ fontWeight: 600, fontSize: '0.6rem' }} />
            <Chip label={`High: ${alertCounts.high}`} size="small" color="warning" sx={{ fontWeight: 600, fontSize: '0.6rem' }} />
          </Stack>
        </Paper>
      </Box>

      {/* ══════════════════════════════════════════════════════
          ROW 2 – Windows Notification  (full-width)
         ══════════════════════════════════════════════════════ */}
      <Paper sx={{ p: 3, mb: 4, borderLeft: '3px solid', borderLeftColor: 'info.main' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2} mb={2}>
          <SectionIcon icon="mdi:bell-ring-outline" bgcolor="info.main" />
          <Box flex={1}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Typography variant="h6" color="text.primary">Thông báo Windows</Typography>
              <Chip
                label={notifState.permission === 'granted' ? 'ENABLED' : notifState.permission === 'denied' ? 'BLOCKED' : 'NOT SET'}
                size="small"
                color={notifState.permission === 'granted' ? 'success' : notifState.permission === 'denied' ? 'error' : 'warning'}
                sx={{ fontWeight: 700, fontSize: '0.65rem' }}
              />
            </Stack>
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary" mb={2.5} lineHeight={1.7}>
          Hiển thị thông báo trực tiếp trên Windows khi phát hiện USB có hành vi bất thường (risk score ≥ 30%).
        </Typography>
        <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
          {notifState.permission !== 'granted' && (
            <Button variant="contained" color="info" startIcon={<IconifyIcon icon="mdi:bell-plus-outline" />} onClick={requestPermission} size="small">
              Bật Notification
            </Button>
          )}
          <Button variant="outlined" color="warning" startIcon={<IconifyIcon icon="mdi:bell-alert-outline" />} onClick={sendTestNotification} size="small" disabled={notifState.permission !== 'granted'}>
            Test Notification
          </Button>
          <Typography variant="caption" color="text.disabled">
            Đã gửi: {notifState.totalSent} notification
            {notifState.lastNotificationTime && (<> · Lần cuối: {new Date(notifState.lastNotificationTime).toLocaleTimeString('vi-VN')}</>)}
          </Typography>
        </Stack>
      </Paper>

      {/* ══════════════════════════════════════════════════════
          ROW 3 – Toggle settings  +  Engine info  (2 cột)
         ══════════════════════════════════════════════════════ */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', xl: '3fr 2fr' }}
        gap={3}
        mb={4}
      >
        {/* --- Giám sát & Phản hồi --- */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" gap={2} mb={3}>
            <SectionIcon icon="mdi:cog-outline" bgcolor="primary.main" />
            <Typography variant="h6" color="text.primary">Giám sát & Phản hồi</Typography>
          </Stack>
          <Stack gap={0}>
            {toggleSettings.map((s, i) => (
              <Stack
                key={s.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  py: 2, px: 2, borderRadius: 1.5,
                  '&:hover': { bgcolor: 'action.hover' },
                  borderBottom: i < toggleSettings.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Stack direction="row" alignItems="center" gap={2} flex={1} minWidth={0}>
                  <IconifyIcon icon={s.icon} width={18} height={18} sx={{ color: s.on ? 'primary.main' : 'text.disabled', flexShrink: 0 }} />
                  <Box minWidth={0}>
                    <Typography variant="body2" color="text.primary" fontWeight={500} noWrap>{s.label}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{s.desc}</Typography>
                  </Box>
                </Stack>
                <Switch defaultChecked={s.on} color="primary" sx={{ flexShrink: 0 }} />
              </Stack>
            ))}
          </Stack>
        </Paper>

        {/* --- Thông tin Engine + Mức bảo vệ --- */}
        <Stack gap={3}>
          {/* Engine info */}
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" gap={2} mb={2.5}>
              <SectionIcon icon="mdi:cpu-64-bit" bgcolor="secondary.main" />
              <Typography variant="h6" color="text.primary">Thông tin Engine</Typography>
            </Stack>
            <Stack gap={0}>
              {engineRows.map((r, i) => (
                <Stack
                  key={r.label}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    py: 1.5, px: 1.5,
                    borderBottom: i < engineRows.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">{r.label}</Typography>
                  <Typography variant="caption" color="text.primary" fontFamily="monospace" fontWeight={600} noWrap>
                    {r.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Protection Level */}
          <Paper sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" gap={2} mb={2.5}>
              <SectionIcon icon="mdi:security" bgcolor="error.main" />
              <Typography variant="h6" color="text.primary">Mức bảo vệ</Typography>
            </Stack>
            <Stack gap={2}>
              {[...protectionModules, {
                label: 'Windows Notification',
                pct: notifPct,
                color: notifPct === 100 ? 'success' as const : 'error' as const,
              }].map((m) => (
                <Box key={m.label}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                    <Typography variant="caption" color="text.primary" fontWeight={700}>{m.pct}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={m.pct} color={m.color} sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover' }} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
      </Box>

      {/* ══════════════════════════════════════════════════════
          ROW 4 – Ngưỡng phát hiện  (full-width, 4 cards grid)
         ══════════════════════════════════════════════════════ */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" gap={2} mb={3}>
          <SectionIcon icon="mdi:tune-vertical" bgcolor="warning.main" />
          <Typography variant="h6" color="text.primary">Ngưỡng phát hiện</Typography>
        </Stack>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }} gap={3}>
          {thresholdSettings.map((t) => (
            <Paper
              key={t.id}
              elevation={0}
              sx={{ p: 2.5, bgcolor: 'background.default', borderRadius: 2 }}
            >
              <Stack direction="row" alignItems="center" gap={1} mb={2}>
                <IconifyIcon icon={t.icon} width={16} height={16} sx={{ color: 'warning.main', flexShrink: 0 }} />
                <Typography variant="caption" color="text.primary" fontWeight={500} flex={1} noWrap>
                  {t.label}
                </Typography>
                <Typography variant="caption" color="primary.main" fontFamily="monospace" fontWeight={700}>
                  {t.value}{t.unit}
                </Typography>
              </Stack>
              <Slider
                defaultValue={t.value} min={t.min} max={t.max} step={t.step} color="primary"
                sx={{ '& .MuiSlider-thumb': { width: 14, height: 14 }, '& .MuiSlider-rail': { opacity: 0.3 } }}
              />
              <Stack direction="row" justifyContent="space-between" mt={-0.5}>
                <Typography variant="caption" color="text.disabled" fontSize="0.65rem">{t.min}{t.unit}</Typography>
                <Typography variant="caption" color="text.disabled" fontSize="0.65rem">{t.max}{t.unit}</Typography>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Paper>
    </>
  );
};

export default SettingsPage;
