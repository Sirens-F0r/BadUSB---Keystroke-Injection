// KDS Guard – User Profile Page
// Hiển thị typing profile và thông tin người dùng hệ thống

import { ReactElement, useState, useCallback } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider';
import ReactEChart from 'components/base/ReactEChart';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipComponent } from 'echarts/components';

echarts.use([RadarChart, CanvasRenderer, TooltipComponent]);

const BASE_TYPING_PROFILES = [
  { id: 1, name: 'KDS Guard Admin', role: 'Administrator', sessions: 12, avgSpeed: 5.2, riskScore: 0.04, avatar: 'KA', color: 'primary' },
  { id: 2, name: 'Test User (Demo)', role: 'Demo Account', sessions: 3, avgSpeed: 4.8, riskScore: 0.02, avatar: 'TU', color: 'info' },
  { id: 3, name: 'Người dùng thật (TB)', role: 'Collected User', sessions: 5, avgSpeed: 4.5, riskScore: 0.03, avatar: 'HT', color: 'success' },
];

const ProfileCard = ({
  profile,
  isActive,
  onClick,
}: {
  profile: (typeof BASE_TYPING_PROFILES)[0];
  isActive: boolean;
  onClick: () => void;
}) => {
    return (
    <Paper
      sx={{
        p: 3,
        cursor: 'pointer',
        border: '2px solid',
        borderColor: isActive ? 'primary.main' : 'transparent',
        borderRadius: 2,
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: isActive ? 'primary.main' : 'divider' },
      }}
      onClick={onClick}
    >
      <Stack direction="row" alignItems="center" gap={2}>
        <Avatar sx={{ bgcolor: `${profile.color}.main`, width: 48, height: 48, fontSize: '1rem', fontWeight: 700 }}>
          {profile.avatar}
        </Avatar>
        <Box flex={1}>
          <Typography variant="body1" color="text.primary" fontWeight={600}>{profile.name}</Typography>
          <Stack direction="row" gap={1} mt={0.5} flexWrap="wrap">
            <Chip label={profile.role} size="small" color={profile.color as 'primary' | 'info' | 'success'} sx={{ fontWeight: 600, fontSize: '0.65rem' }} />
            <Chip label={`${profile.sessions} sessions`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.65rem' }} />
          </Stack>
        </Box>
        {isActive && (
          <Chip label="ACTIVE" size="small" color="success" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
        )}
      </Stack>
    </Paper>
  );
};

const ProfilePage = (): ReactElement => {
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [editedName, setEditedName] = useState(BASE_TYPING_PROFILES[0].name);
  const { keystrokeMetrics } = useDashboardSnapshot();

  const activeProfile = BASE_TYPING_PROFILES[selectedProfile];

  const handleSaveProfile = useCallback(() => {
    setSnackbar({ open: true, message: 'Hồ sơ đã được lưu thành công!' });
  }, []);

  const handleExportProfile = useCallback(() => {
    const data = {
      profile: activeProfile,
      keystrokeMetrics,
      exportTime: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kds-profile-${activeProfile.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: 'Hồ sơ đã được xuất ra file JSON!' });
  }, [activeProfile, keystrokeMetrics]);

  const metricKeys = Object.keys(keystrokeMetrics);
  const radarIndicator = [
    { name: 'Flight Time TB', max: 500 },
    { name: 'CV Flight', max: 10 },
    { name: 'Typing Speed', max: 40 },
    { name: 'Hold Time TB', max: 200 },
    { name: 'Modifier Ratio', max: 0.5 },
    { name: 'Burst Length', max: 30 },
  ];

  const radarOption = {
    tooltip: { trigger: 'item' },
    legend: {
      data: metricKeys,
      textStyle: { color: '#CAC9D7', fontSize: 11 },
      bottom: 0,
    },
    radar: {
      indicator: radarIndicator,
      splitArea: { areaStyle: { color: ['rgba(58,180,164,0.04)', 'rgba(58,180,164,0.08)'] } },
      axisLine: { lineStyle: { color: '#2B2B36' } },
      splitLine: { lineStyle: { color: '#2B2B36' } },
    },
    series: [{
      type: 'radar',
      data: metricKeys.map((key, idx) => {
        const vals = keystrokeMetrics[key];
        return {
          value: vals.length >= 6 ? vals.slice(0, 6) : [...vals, ...Array(6 - vals.length).fill(0)],
          name: key,
          lineStyle: { color: idx === 0 ? '#3AB4A4' : '#FF3F56', width: idx === 0 ? 2 : 1 },
          areaStyle: { color: idx === 0 ? 'rgba(58,180,164,0.2)' : 'rgba(255,63,86,0.1)' },
          symbol: 'none',
        };
      }),
    }],
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={3}>
        <Box>
          <Typography variant="h4" color="text.primary" mb={1}>Hồ sơ người dùng</Typography>
          <Typography variant="body2" color="text.disabled">
            Quản lý hồ sơ động học gõ phím và thông tin tài khoản
          </Typography>
        </Box>
        <Stack direction="row" gap={2} flexWrap="wrap">
          <Button
            variant="outlined"
            color="info"
            size="small"
            startIcon={<IconifyIcon icon="mdi:export-variant" />}
            onClick={handleExportProfile}
            sx={{ color: 'text.secondary', borderColor: 'divider' }}
          >
            Xuất hồ sơ
          </Button>
        </Stack>
      </Stack>

      {/* Profile Cards */}
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={2} mb={4}>
        {BASE_TYPING_PROFILES.map((profile, idx) => (
          <Box key={profile.id} gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}>
            <ProfileCard
              profile={profile}
              isActive={idx === selectedProfile}
              onClick={() => setSelectedProfile(idx)}
            />
          </Box>
        ))}
      </Box>

      {/* Selected Profile Details + Radar Chart */}
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
        {/* Profile Info */}
        <Box gridColumn={{ xs: 'span 12', lg: 'span 5' }}>
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" gap={3} mb={3}>
              <Avatar sx={{ bgcolor: `${activeProfile.color}.main`, width: 64, height: 64, fontSize: '1.3rem', fontWeight: 700 }}>
                {activeProfile.avatar}
              </Avatar>
              <Box>
                <Typography variant="h5" color="text.primary">{activeProfile.name}</Typography>
                <Chip label={activeProfile.role} size="small" color={activeProfile.color as 'primary' | 'info' | 'success'} sx={{ fontWeight: 600, mt: 1 }} />
              </Box>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Stack gap={2.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.disabled">Tốc độ gõ TB</Typography>
                <Typography variant="body2" color="text.primary" fontFamily="monospace" fontWeight={700}>{activeProfile.avgSpeed} keys/s</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.disabled">Risk Score</Typography>
                <Typography variant="body2" color={activeProfile.riskScore > 0.6 ? 'error.main' : activeProfile.riskScore > 0.3 ? 'warning.main' : 'success.main'} fontFamily="monospace" fontWeight={700}>{activeProfile.riskScore.toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.disabled">Sessions đã ghi</Typography>
                <Typography variant="body2" color="text.primary" fontFamily="monospace" fontWeight={700}>{activeProfile.sessions}</Typography>
              </Stack>

              <Divider />

              <TextField
                label="Tên hiển thị"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <IconifyIcon icon="mdi:account-outline" width={16} height={16} />,
                }}
              />
              <Button variant="contained" color="primary" onClick={handleSaveProfile} fullWidth>
                Lưu thay đổi
              </Button>
            </Stack>
          </Paper>
        </Box>

        {/* Radar Chart */}
        <Box gridColumn={{ xs: 'span 12', lg: 'span 7' }}>
          <Paper sx={{ p: 4, borderRadius: 3, height: 1 }}>
            <Typography variant="h5" color="text.primary" mb={0.5}>Đặc trưng gõ phím</Typography>
            <Typography variant="caption" color="text.disabled" mb={3} display="block">So sánh đặc trưng gõ phím</Typography>
            <Box sx={{ height: 360 }}>
              <ReactEChart
                echarts={echarts}
                option={radarOption}
                style={{ height: '100%', width: '100%' }}
              />
            </Box>
            <Stack direction="row" gap={3} mt={2} flexWrap="wrap">
              <Stack direction="row" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 3, bgcolor: 'primary.main', borderRadius: 1 }} />
                <Typography variant="caption" color="text.disabled">Người dùng thật (TB)</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" gap={1}>
                <Box sx={{ width: 12, height: 3, bgcolor: 'error.main', borderRadius: 1 }} />
                <Typography variant="caption" color="text.disabled">BadUSB Injection</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      </Box>

      {/* System Stats */}
      <Typography variant="h5" color="text.primary" mt={5} mb={2}>Thống kê hệ thống</Typography>
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={2}>
        {[
          { label: 'Tổng sessions', value: `${BASE_TYPING_PROFILES.reduce((a, p) => a + p.sessions, 0)}`, icon: 'mdi:keyboard-outline', color: 'info' },
          { label: 'Tổng mẫu features', value: '21,963', icon: 'mdi:database-check-outline', color: 'primary' },
          { label: 'Tổng cảnh báo', value: '232', icon: 'mdi:shield-alert-outline', color: 'warning' },
          { label: 'Thời gian hoạt động', value: '2h 15m', icon: 'mdi:clock-outline', color: 'success' },
        ].map((stat) => (
          <Box key={stat.label} gridColumn={{ xs: 'span 6', md: 'span 3' }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" gap={2} mb={1.5}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${stat.color}.main`, opacity: 0.15 }}>
                  <IconifyIcon icon={stat.icon} width={18} height={18} color={`${stat.color}.main`} />
                </Box>
              </Stack>
              <Typography variant="h5" color="text.primary" fontFamily="monospace" fontWeight={700}>{stat.value}</Typography>
              <Typography variant="caption" color="text.disabled">{stat.label}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProfilePage;
