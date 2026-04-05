/**
 * KDS Guard React Hooks
 *
 * Custom hooks kết nối Dashboard components → kds-guard-api service
 * Khi chuyển từ mock → real backend, chỉ cần đổi USE_MOCK trong kds-guard-api.ts
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchSystemStatus,
    fetchDetectorConfig,
    fetchLatestDetection,
    connectRealtime,
    type SystemStatus,
    type DetectorConfig,
    type DetectionResult,
    type RealtimeMessage,
} from 'services/kds-guard-api';

/**
 * Hook: Lấy trạng thái hệ thống, auto-refresh mỗi 5 giây
 */
export function useSystemStatus(refreshInterval = 5000) {
    const [status, setStatus] = useState<SystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            const data = await fetchSystemStatus();
            setStatus(data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch status');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const timer = setInterval(refresh, refreshInterval);
        return () => clearInterval(timer);
    }, [refresh, refreshInterval]);

    return { status, loading, error, refresh };
}

/**
 * Hook: Lấy cấu hình detector (fetch 1 lần)
 */
export function useDetectorConfig() {
    const [config, setConfig] = useState<DetectorConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetectorConfig()
            .then(setConfig)
            .finally(() => setLoading(false));
    }, []);

    return { config, loading };
}

/**
 * Hook: Lấy detection result mới nhất, auto-refresh
 */
export function useLatestDetection(refreshInterval = 3000) {
    const [detection, setDetection] = useState<DetectionResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchLatestDetection();
                setDetection(data);
            } finally {
                setLoading(false);
            }
        };

        load();
        const timer = setInterval(load, refreshInterval);
        return () => clearInterval(timer);
    }, [refreshInterval]);

    return { detection, loading };
}

/**
 * Hook: Kết nối WebSocket realtime
 * Trả về stream detection results + key events
 */
export function useRealtimeStream() {
    const [connected, setConnected] = useState(false);
    const [latestDetection, setLatestDetection] = useState<DetectionResult | null>(null);
    const [detectionHistory, setDetectionHistory] = useState<DetectionResult[]>([]);
    const disconnectRef = useRef<(() => void) | null>(null);

    const connect = useCallback(() => {
        const handler = (msg: RealtimeMessage) => {
            if (msg.type === 'detection_result') {
                setLatestDetection(msg.data);
                setDetectionHistory((prev) => [...prev.slice(-99), msg.data]); // Giữ 100 entries gần nhất
            }
        };

        disconnectRef.current = connectRealtime(handler);
        setConnected(true);
    }, []);

    const disconnect = useCallback(() => {
        if (disconnectRef.current) {
            disconnectRef.current();
            disconnectRef.current = null;
            setConnected(false);
        }
    }, []);

    // Auto-connect khi mount
    useEffect(() => {
        connect();
        return disconnect;
    }, [connect, disconnect]);

    return {
        connected,
        latestDetection,
        detectionHistory,
        connect,
        disconnect,
    };
}
