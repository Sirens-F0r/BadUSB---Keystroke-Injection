// KDS Guard – Devices Page
// Giám sát USB/HID devices

import { ReactElement } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface Device {
  id: number;
  name: string;
  vid: string;
  pid: string;
  connectedAt: string;
  type: string;
  status: 'trusted' | 'monitoring' | 'suspicious' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high';
  enhancedMonitoring: boolean;
}

const devicesData: Device[] = [
  {
    id: 1,
    name: 'Logitech K380 Keyboard',
    vid: '046D',
    pid: 'B342',
    connectedAt: '2026-04-05 07:58',
    type: 'HID Keyboard',
    status: 'trusted',
    riskLevel: 'low',
    enhancedMonitoring: false,
  },
  {
    id: 2,
    name: 'Unknown USB Keyboard',
    vid: '04D9',
    pid: '0348',
    connectedAt: '2026-04-05 10:18',
    type: 'HID Keyboard',
    status: 'monitoring',
    riskLevel: 'medium',
    enhancedMonitoring: true,
  },
  {
    id: 3,
    name: 'Generic USB Hub',
    vid: '1A40',
    pid: '0201',
    connectedAt: '2026-04-05 09:00',
    type: 'USB Hub',
    status: 'trusted',
    riskLevel: 'low',
    enhancedMonitoring: false,
  },
];

const statusConfig: Record<string, { color: 'success' | 'warning' | 'error' | 'info' }> = {
  trusted: { color: 'success' },
  monitoring: { color: 'info' },
  suspicious: { color: 'warning' },
  blocked: { color: 'error' },
};

const DevicesPage = (): ReactElement => {
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Typography variant="h4" color="common.white" mb={1}>
            Giám sát thiết bị
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Các thiết bị USB/HID đang kết nối và trạng thái bảo mật
          </Typography>
        </Box>
        <Chip
          icon={<IconifyIcon icon="mdi:usb" width={16} height={16} />}
          label={`${devicesData.length} thiết bị đang kết nối`}
          size="small"
          color="info"
          sx={{ fontWeight: 600 }}
        />
      </Stack>

      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
        {devicesData.map((device) => (
          <Box key={device.id} gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}>
            <Paper sx={{ p: 5, height: 1 }}>
              <Stack direction="row" alignItems="center" gap={2} mb={3}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${statusConfig[device.status].color}.main`,
                    opacity: 0.15,
                    position: 'relative',
                  }}
                >
                  <IconifyIcon
                    icon="mdi:usb"
                    width={24}
                    height={24}
                    sx={{
                      position: 'absolute',
                      color: `${statusConfig[device.status].color}.main`,
                      opacity: 1,
                    }}
                  />
                </Box>
                <Box flex={1}>
                  <Typography variant="body1" color="common.white" fontWeight={600}>
                    {device.name}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {device.type}
                  </Typography>
                </Box>
                <Chip
                  label={device.status.toUpperCase()}
                  size="small"
                  color={statusConfig[device.status].color}
                  sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                />
              </Stack>

              <Stack gap={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.disabled">VID:PID</Typography>
                  <Typography variant="caption" color="common.white" fontFamily="monospace">
                    {device.vid}:{device.pid}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.disabled">Kết nối lúc</Typography>
                  <Typography variant="caption" color="common.white">{device.connectedAt}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.disabled">Mức rủi ro</Typography>
                  <Chip
                    label={device.riskLevel.toUpperCase()}
                    size="small"
                    color={device.riskLevel === 'high' ? 'error' : device.riskLevel === 'medium' ? 'warning' : 'success'}
                    sx={{ fontWeight: 700, fontSize: '0.6rem', height: 20 }}
                  />
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.disabled">Giám sát nâng cao</Typography>
                  <Typography variant="caption" color={device.enhancedMonitoring ? 'warning.main' : 'text.disabled'}>
                    {device.enhancedMonitoring ? 'Đang bật' : 'Tắt'}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        ))}
      </Box>
    </>
  );
};

export default DevicesPage;
