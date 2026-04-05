/**
 * KDS Guard – Windows Native Notification Hook
 *
 * Sử dụng Web Notification API để hiển thị thông báo Toast trực tiếp trên Windows
 * khi phát hiện hành vi bất thường từ USB/keyboard.
 *
 * Notification sẽ hiện trên thanh taskbar Windows giống như thông báo hệ thống.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { RiskLevel, DetectionResult } from 'services/kds-guard-api';

// Cấu hình ngưỡng cảnh báo
const NOTIFICATION_THRESHOLDS = {
    /** Risk score tối thiểu để gửi notification (0.0 - 1.0) */
    minRiskScore: 0.3,
    /** Thời gian tối thiểu giữa 2 notification (ms) – tránh spam */
    cooldownMs: 10000,
    /** Các risk level sẽ trigger notification */
    alertLevels: ['Medium', 'High', 'Critical'] as RiskLevel[],
};

/** Map risk level → icon tag + urgency */
const RISK_NOTIFICATION_CONFIG: Record<
    string,
    { tag: string; urgency: string; icon: string }
> = {
    Medium: {
        tag: 'kds-medium',
        urgency: '⚠️',
        icon: '/Logo bảo mật KDS Guard.png',
    },
    High: {
        tag: 'kds-high',
        urgency: '🟠',
        icon: '/Logo bảo mật KDS Guard.png',
    },
    Critical: {
        tag: 'kds-critical',
        urgency: '🔴',
        icon: '/Logo bảo mật KDS Guard.png',
    },
};

export interface NotificationState {
    /** Quyền hiện tại: granted, denied, default */
    permission: NotificationPermission;
    /** Đã bật notification chưa */
    enabled: boolean;
    /** Tổng số notification đã gửi trong session */
    totalSent: number;
    /** Timestamp notification cuối cùng */
    lastNotificationTime: number | null;
}

/**
 * Hook chính: quản lý Windows notification cho KDS Guard
 *
 * Sử dụng:
 * ```tsx
 * const { requestPermission, notify, state } = useWindowsNotification();
 *
 * // Gọi khi có detection result mới
 * useEffect(() => {
 *   if (detection) notify(detection);
 * }, [detection, notify]);
 * ```
 */
export function useWindowsNotification() {
    const [state, setState] = useState<NotificationState>({
        permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
        enabled: typeof Notification !== 'undefined' && Notification.permission === 'granted',
        totalSent: 0,
        lastNotificationTime: null,
    });

    const lastNotifTimeRef = useRef<number>(0);

    /**
     * Yêu cầu quyền hiển thị notification từ browser
     * → Windows sẽ hiện popup hỏi cho phép
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (typeof Notification === 'undefined') {
            console.warn('[KDS Guard] Browser không hỗ trợ Notification API');
            return false;
        }

        if (Notification.permission === 'granted') {
            setState((prev) => ({ ...prev, permission: 'granted', enabled: true }));
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('[KDS Guard] Notification đã bị chặn. Vui lòng bật lại trong Settings trình duyệt.');
            return false;
        }

        const result = await Notification.requestPermission();
        const granted = result === 'granted';
        setState((prev) => ({
            ...prev,
            permission: result,
            enabled: granted,
        }));
        return granted;
    }, []);

    /**
     * Gửi notification khi detection result vượt ngưỡng
     */
    const notify = useCallback(
        (detection: DetectionResult) => {
            // Kiểm tra điều kiện
            if (typeof Notification === 'undefined') return;
            if (Notification.permission !== 'granted') return;
            if (detection.risk_score < NOTIFICATION_THRESHOLDS.minRiskScore) return;
            if (!NOTIFICATION_THRESHOLDS.alertLevels.includes(detection.risk_level)) return;

            // Kiểm tra cooldown
            const now = Date.now();
            if (now - lastNotifTimeRef.current < NOTIFICATION_THRESHOLDS.cooldownMs) return;

            // Tạo notification content
            const config = RISK_NOTIFICATION_CONFIG[detection.risk_level] || RISK_NOTIFICATION_CONFIG.Medium;
            const title = `${config.urgency} KDS Guard – ${detection.risk_level.toUpperCase()} Risk Detected!`;

            const reasonText =
                detection.reasons.length > 0
                    ? detection.reasons.slice(0, 3).join('\n')
                    : 'Phát hiện hành vi gõ phím bất thường.';

            const body = [
                `Risk Score: ${(detection.risk_score * 100).toFixed(0)}%`,
                `Triggered: ${detection.reasons.length} rule(s)`,
                '',
                reasonText,
            ].join('\n');

            // Gửi Windows notification
            try {
                const notification = new Notification(title, {
                    body,
                    icon: config.icon,
                    tag: config.tag, // Gom notification cùng level → tránh spam
                    requireInteraction: detection.risk_level === 'Critical', // Critical → không auto-close
                    silent: false, // Phát âm thanh Windows
                });

                // Click notification → mở dashboard
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                // Cập nhật state
                lastNotifTimeRef.current = now;
                setState((prev) => ({
                    ...prev,
                    totalSent: prev.totalSent + 1,
                    lastNotificationTime: now,
                }));
            } catch (err) {
                console.error('[KDS Guard] Notification error:', err);
            }
        },
        [],
    );

    /**
     * Gửi notification test để kiểm tra
     */
    const sendTestNotification = useCallback(() => {
        const testDetection: DetectionResult = {
            risk_score: 0.75,
            risk_level: 'High',
            rule_score: 0.65,
            reasons: [
                'Flight time quá thấp (< 30ms)',
                'Typing speed vượt ngưỡng (> 20 keys/s)',
                'Phát hiện burst injection (25 keys liên tiếp)',
            ],
            window_start_ms: Date.now() - 5000,
            window_end_ms: Date.now(),
        };

        // Bypass cooldown cho test
        lastNotifTimeRef.current = 0;
        notify(testDetection);
    }, [notify]);

    // Auto-request permission khi mount
    useEffect(() => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            requestPermission();
        }
    }, [requestPermission]);

    return {
        state,
        requestPermission,
        notify,
        sendTestNotification,
    };
}
