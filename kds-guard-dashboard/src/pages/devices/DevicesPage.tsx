// KDS Guard – Devices Page
// Giám sát USB/HID devices — dùng PowerShell WMI từ Electron main process

import { ReactElement, useEffect, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Paper,
    Snackbar,
    Stack,
    Typography,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface RawDevice {
    FriendlyName?: string;
    InstanceId?: string;
    Status?: string;
    Name?: string;
    DeviceID?: string;
}

interface ParsedDevice {
    id: number;
    name: string;
    vid: string;
    pid: string;
    instanceId: string;
    connectedAt: string;
    type: string;
    status: 'trusted' | 'monitoring' | 'suspicious' | 'blocked';
    riskLevel: 'low' | 'medium' | 'high';
    enhancedMonitoring: boolean;
}

function parseDevice(raw: RawDevice, idx: number): ParsedDevice {
    const name = raw.FriendlyName || raw.Name || 'Unknown Device';
    const instanceId = raw.InstanceId || raw.DeviceID || '';
    // Parse VID/PID from InstanceId like "USB\\VID_046D&PID_B342\\..."
    const vidMatch = instanceId.match(/VID_([0-9A-F]{4})/i);
    const pidMatch = instanceId.match(/PID_([0-9A-F]{4})/i);
    const vid = vidMatch ? vidMatch[1] : 'N/A';
    const pid = pidMatch ? pidMatch[1] : 'N/A';

    // Classify device type
    let type = 'USB Device';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('keyboard') || lowerName.includes('bàn phím')) {
        type = 'HID Keyboard';
    } else if (lowerName.includes('mouse') || lowerName.includes('chuột')) {
        type = 'HID Mouse';
    } else if (lowerName.includes('hub')) {
        type = 'USB Hub';
    }

    // Determine risk and monitoring based on name heuristics
    let status: ParsedDevice['status'] = 'trusted';
    let riskLevel: ParsedDevice['riskLevel'] = 'low';
    let enhancedMonitoring = false;

    if (name === 'Unknown Device' || vid === 'N/A') {
        status = 'monitoring';
        riskLevel = 'medium';
        enhancedMonitoring = true;
    } else if (
        lowerName.includes('unknown') ||
        lowerName.includes('generic') ||
        lowerName.includes('usb composite')
    ) {
        status = 'monitoring';
        riskLevel = 'medium';
        enhancedMonitoring = true;
    } else if (lowerName.includes('logitech') || lowerName.includes('microsoft') || lowerName.includes('dell')) {
        status = 'trusted';
        riskLevel = 'low';
        enhancedMonitoring = false;
    }

    // Known keyboards are trusted
    if (type === 'HID Keyboard' && status === 'monitoring') {
        status = 'trusted';
        riskLevel = 'low';
        enhancedMonitoring = false;
    }

    return {
        id: idx,
        name,
        vid,
        pid,
        instanceId,
        connectedAt: new Date().toLocaleString('vi-VN'),
        type,
        status,
        riskLevel,
        enhancedMonitoring,
    };
}

const statusConfig: Record<
    string,
    { color: 'success' | 'warning' | 'error' | 'info' }
> = {
    trusted: { color: 'success' },
    monitoring: { color: 'info' },
    suspicious: { color: 'warning' },
    blocked: { color: 'error' },
};

const DevicesPage = (): ReactElement => {
    const [devices, setDevices] = useState<ParsedDevice[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [blockingDeviceId, setBlockingDeviceId] = useState<string | null>(null);
    const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const raw = await window.electronAPI?.getUsbDevices();
            if (Array.isArray(raw)) {
                const parsed = (raw as RawDevice[]).map(parseDevice);
                setDevices(parsed);
            } else if (typeof raw === 'string' && raw) {
                try {
                    const parsed = JSON.parse(raw);
                    const arr = Array.isArray(parsed) ? parsed : [parsed];
                    setDevices(arr.map(parseDevice));
                } catch {
                    setDevices([]);
                }
            } else {
                setDevices([]);
            }
        } catch {
            setDevices([]);
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    };

    const handleBlockRequest = (device: ParsedDevice, action: 'block' | 'unblock') => {
        setBlockingDeviceId(device.instanceId);
        setBlockAction(action);
    };

    const handleConfirmBlock = async () => {
        if (!blockingDeviceId) return;
        const api = blockAction === 'block'
            ? window.electronAPI?.blockUsbDevice
            : window.electronAPI?.unblockUsbDevice;
        if (!api) {
            setSnackbar({ open: true, message: 'Chức năng chặn thiết bị chỉ hoạt động trong ứng dụng Electron', severity: 'error' });
            setBlockingDeviceId(null);
            return;
        }
        const result = await api(blockingDeviceId);
        setSnackbar({
            open: true,
            message: result.success ? `Thành công: ${result.message}` : `Lỗi: ${result.message}`,
            severity: result.success ? 'success' : 'error',
        });
        setBlockingDeviceId(null);
        if (result.success) {
            void fetchDevices();
        }
    };

    useEffect(() => {
        void fetchDevices();
        // Refresh every 30 seconds
        const interval = setInterval(() => void fetchDevices(), 30000);
        return () => clearInterval(interval);
    }, []);

    const trustedCount = devices.filter(
        (d) => d.status === 'trusted',
    ).length;
    const monitoringCount = devices.filter(
        (d) => d.status === 'monitoring',
    ).length;

    return (
        <>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={6}
                flexWrap="wrap"
                gap={3}
            >
                <Box>
                    <Typography
                        variant="h4"
                        color="text.primary"
                        mb={1}
                    >
                        Giám sát thiết bị
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.disabled"
                    >
                        Các thiết bị USB/HID đang kết nối và trạng thái
                        bảo mật
                    </Typography>
                </Box>
                <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
                    {lastRefresh && (
                        <Typography variant="caption" color="text.disabled">
                            Cập nhật:{' '}
                            {lastRefresh.toLocaleTimeString('vi-VN')}
                        </Typography>
                    )}
                    <Chip
                        icon={
                            <IconifyIcon
                                icon="mdi:usb"
                                width={16}
                                height={16}
                            />
                        }
                        label={`${devices.length} thiết bị đang kết nối`}
                        size="small"
                        color="info"
                        sx={{ fontWeight: 600 }}
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                            loading ? (
                                <CircularProgress
                                    size={14}
                                    color="inherit"
                                />
                            ) : (
                                <IconifyIcon
                                    icon="mdi:refresh"
                                    width={14}
                                    height={14}
                                />
                            )
                        }
                        onClick={() => void fetchDevices()}
                        disabled={loading}
                        sx={{ color: 'text.secondary', borderColor: 'divider' }}
                    >
                        Làm mới
                    </Button>
                </Stack>
            </Stack>

            {/* Summary chips */}
            <Stack direction="row" gap={2} mb={4} flexWrap="wrap">
                <Chip
                    label={`${trustedCount} đáng tin cậy`}
                    size="small"
                    color="success"
                    icon={<IconifyIcon icon="mdi:shield-check" width={14} height={14} />}
                />
                <Chip
                    label={`${monitoringCount} đang giám sát`}
                    size="small"
                    color="info"
                    icon={<IconifyIcon icon="mdi:shield-outline" width={14} height={14} />}
                />
                <Chip
                    label={`${devices.length - trustedCount - monitoringCount} khác`}
                    size="small"
                    color="default"
                />
            </Stack>

            {devices.length === 0 && !loading && (
                <Paper sx={{ p: 5, textAlign: 'center' }}>
                    <IconifyIcon
                        icon="mdi:usb-off"
                        width={48}
                        height={48}
                        color="text.disabled"
                    />
                    <Typography
                        variant="body1"
                        color="text.disabled"
                        mt={2}
                    >
                        Không tìm thấy thiết bị USB/HID nào
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.disabled"
                    >
                        Thử nhấn &quot;Làm mới&quot; hoặc kiểm tra quyền truy cập
                        thiết bị
                    </Typography>
                </Paper>
            )}

            <Box
                display="grid"
                gridTemplateColumns="repeat(12, 1fr)"
                gap={3}
            >
                {devices.map((device) => {
                    const cfg = statusConfig[device.status];
                    return (
                        <Box
                            key={device.id}
                            gridColumn={{
                                xs: 'span 12',
                                md: 'span 6',
                                xl: 'span 4',
                            }}
                        >
                            <Paper sx={{ p: 5, height: 1 }}>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    gap={2}
                                    mb={3}
                                >
                                    <Box
                                        sx={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: `${cfg.color}.main`,
                                            opacity: 0.15,
                                            position: 'relative',
                                        }}
                                    >
                                        <IconifyIcon
                                            icon={
                                                device.type ===
                                                'HID Keyboard'
                                                    ? 'mdi:keyboard'
                                                    : device.type ===
                                                        'HID Mouse'
                                                      ? 'mdi:mouse'
                                                      : 'mdi:usb'
                                            }
                                            width={24}
                                            height={24}
                                            sx={{
                                                position: 'absolute',
                                                color: `${cfg.color}.main`,
                                                opacity: 1,
                                            }}
                                        />
                                    </Box>
                                    <Box flex={1}>
                                        <Typography
                                            variant="body1"
                                            color="text.primary"
                                            fontWeight={600}
                                        >
                                            {device.name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                        >
                                            {device.type}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={device.status.toUpperCase()}
                                        size="small"
                                        color={cfg.color}
                                        sx={{
                                            fontWeight: 700,
                                            fontSize: '0.65rem',
                                        }}
                                    />
                                </Stack>

                                <Stack gap={1.5}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                        >
                                            VID:PID
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.primary"
                                            fontFamily="monospace"
                                        >
                                            {device.vid}:{device.pid}
                                        </Typography>
                                    </Stack>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                        >
                                            Kết nối lúc
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.primary"
                                        >
                                            {device.connectedAt}
                                        </Typography>
                                    </Stack>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                        >
                                            Mức rủi ro
                                        </Typography>
                                        <Chip
                                            label={device.riskLevel.toUpperCase()}
                                            size="small"
                                            color={
                                                device.riskLevel === 'high'
                                                    ? 'error'
                                                    : device.riskLevel ===
                                                        'medium'
                                                      ? 'warning'
                                                      : 'success'
                                            }
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: '0.6rem',
                                                height: 20,
                                            }}
                                        />
                                    </Stack>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                        >
                                            Giám sát nâng cao
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color={
                                                device.enhancedMonitoring
                                                    ? 'warning.main'
                                                    : 'text.disabled'
                                            }
                                        >
                                            {device.enhancedMonitoring
                                                ? 'Đang bật'
                                                : 'Tắt'}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" gap={1} mt={1}>
                                        {(device.status === 'monitoring' || device.status === 'trusted') && (
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                size="small"
                                                startIcon={<IconifyIcon icon="mdi:block-helper" width={12} height={12} />}
                                                onClick={() => handleBlockRequest(device, 'block')}
                                                sx={{ fontSize: '0.65rem', py: 0.25 }}
                                            >
                                                Chặn
                                            </Button>
                                        )}
                                        {device.status === 'blocked' && (
                                            <Button
                                                variant="outlined"
                                                color="success"
                                                size="small"
                                                startIcon={<IconifyIcon icon="mdi:lock-open-outline" width={12} height={12} />}
                                                onClick={() => handleBlockRequest(device, 'unblock')}
                                                sx={{ fontSize: '0.65rem', py: 0.25 }}
                                            >
                                                Khôi phục
                                            </Button>
                                        )}
                                    </Stack>
                                </Stack>
                            </Paper>
                        </Box>
                    );
                })}
            </Box>

            {/* Block/Unblock Confirmation Dialog */}
            <Dialog open={!!blockingDeviceId} onClose={() => setBlockingDeviceId(null)}>
                <DialogTitle>
                    {blockAction === 'block' ? 'Xác nhận chặn thiết bị' : 'Xác nhận khôi phục thiết bị'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {blockAction === 'block'
                            ? 'Bạn có chắc muốn vô hiệu hóa thiết bị USB này? Hành động này cần quyền Administrator và có thể ảnh hưởng đến bàn phím/chuột đang dùng.'
                            : 'Bạn có chắc muốn khôi phục thiết bị USB này? Thiết bị sẽ được bật lại.'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBlockingDeviceId(null)} color="inherit">
                        Hủy
                    </Button>
                    <Button
                        onClick={handleConfirmBlock}
                        color={blockAction === 'block' ? 'error' : 'success'}
                        variant="contained"
                    >
                        {blockAction === 'block' ? 'Chặn thiết bị' : 'Khôi phục'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar Notification */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default DevicesPage;
