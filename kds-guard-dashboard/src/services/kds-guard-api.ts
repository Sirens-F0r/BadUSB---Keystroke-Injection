/**
 * KDS Guard API Service Layer
 *
 * Lớp trung gian kết nối Dashboard ↔ Backend.
 * Hiện tại: dùng dữ liệu thật từ dataset (21,173 samples, 5 người dùng)
 * Khi có backend thật: thay useMock = false, cấu hình API_BASE_URL
 *
 * Data structures map 1:1 với Rust engine:
 * - FeatureVector  (feature.rs)
 * - DetectionResult (detector.rs)
 * - PolicyAction   (policy.rs)
 * - KeyEvent       (input_capture.rs)
 */

// ===== CẤU HÌNH =====
const API_BASE_URL = 'http://localhost:8080/api';
/** Bridge Python: ws_bridge.py → ws://localhost:8765 */
const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8765';
/** Chỉ true khi đặt VITE_USE_MOCK=true (demo không cần engine). Mặc định: WebSocket thật */
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

function mapRustRiskLevel(s: string): RiskLevel {
    const up = String(s).toUpperCase();
    const map: Record<string, RiskLevel> = {
        NORMAL: 'Normal',
        LOW: 'Low',
        MEDIUM: 'Medium',
        HIGH: 'High',
        CRITICAL: 'Critical',
    };
    return map[up] ?? 'Normal';
}

// ===== TYPESCRIPT INTERFACES (map với Rust structs) =====

/** Map: kds_guard/src/input_capture.rs → KeyEvent */
export interface KeyEvent {
    timestamp_ms: number;
    key_code: string;
    event_type: 'down' | 'up';
    key_class: 'alpha' | 'digit' | 'modifier' | 'special' | 'function' | 'navigation' | 'other';
    is_modifier: boolean;
    session_id: string;
    user_id: string;
}

/** Map: kds_guard/src/feature.rs → FeatureVector */
export interface FeatureVector {
    window_start_ms: number;
    window_end_ms: number;
    num_keys: number;

    // Hold Time stats
    mean_hold_time: number;
    std_hold_time: number;
    median_hold_time: number;
    iqr_hold_time: number;

    // Flight Time stats
    mean_flight_time: number;
    std_flight_time: number;
    median_flight_time: number;
    iqr_flight_time: number;

    // Detection indicators
    cv_flight_time: number;
    typing_speed: number;
    modifier_ratio: number;
    special_ratio: number;
    has_burst: boolean;
    max_burst_length: number;
    min_flight_time: number;
    p5_flight_time: number;
    p95_flight_time: number;
}

/** Map: kds_guard/src/detector.rs → RiskLevel */
export type RiskLevel = 'Normal' | 'Low' | 'Medium' | 'High' | 'Critical';

/** Map: kds_guard/src/detector.rs → DetectionResult */
export interface DetectionResult {
    risk_score: number;       // 0.0 - 1.0
    risk_level: RiskLevel;
    rule_score: number;
    reasons: string[];
    window_start_ms: number;
    window_end_ms: number;
}

/** Map: kds_guard/src/policy.rs → PolicyAction */
export type PolicyAction =
    | { type: 'Allow' }
    | { type: 'LogOnly'; message: string }
    | { type: 'Alert'; message: string }
    | { type: 'SoftBlock'; message: string; duration_ms: number }
    | { type: 'Challenge'; message: string; expected_input: string };

/** Map: kds_guard/src/detector.rs → DetectorConfig */
export interface DetectorConfig {
    ft_mean_threshold_ms: number;
    ft_cv_threshold: number;
    max_human_speed: number;
    burst_length_threshold: number;
    ht_iqr_threshold_ms: number;
    modifier_ratio_threshold: number;
    rule_weight: number;
    anomaly_weight: number;
    threshold_medium: number;
    threshold_high: number;
    threshold_critical: number;
}

// ===== DASHBOARD STATE =====

export interface SystemStatus {
    is_running: boolean;
    mode: 'detection' | 'collect_only';
    uptime_seconds: number;
    total_events: number;
    total_windows_analyzed: number;
    current_session_id: string;
    user_id: string;
}

export interface AlertEntry {
    id: string;
    timestamp: string;
    risk_level: RiskLevel;
    risk_score: number;
    reasons: string[];
    action: PolicyAction;
}

// ===== API FUNCTIONS =====

/**
 * Lấy trạng thái hệ thống hiện tại
 */
export async function fetchSystemStatus(): Promise<SystemStatus> {
    if (USE_MOCK) {
        // Dữ liệu thật: 5 người dùng, 21173 samples, 138 windows từ Rust collector
        return {
            is_running: true,
            mode: 'detection',
            uptime_seconds: 7200,
            total_events: 21173,
            total_windows_analyzed: 138,
            current_session_id: '20260419_194308',
            user_id: 'kds_guard_system',
        };
    }
    const res = await fetch(`${API_BASE_URL}/status`);
    return res.json();
}

/**
 * Lấy cấu hình detector hiện tại
 */
export async function fetchDetectorConfig(): Promise<DetectorConfig> {
    if (USE_MOCK) {
        // Thresholds tối ưu từ evaluation_report.json (19/04/2026)
        return {
            ft_mean_threshold_ms: 20.0,
            ft_cv_threshold: 0.15,
            max_human_speed: 12.0,
            burst_length_threshold: 15,
            ht_iqr_threshold_ms: 5.0,
            modifier_ratio_threshold: 0.4,
            rule_weight: 0.6,
            anomaly_weight: 0.4,
            threshold_medium: 0.2,
            threshold_high: 0.6,
            threshold_critical: 0.8,
        };
    }
    const res = await fetch(`${API_BASE_URL}/config`);
    return res.json();
}

/**
 * Lấy kết quả phân tích mới nhất
 */
export async function fetchLatestDetection(): Promise<DetectionResult | null> {
    if (USE_MOCK) {
        // Risk score thấp = hệ thống an toàn (dữ liệu người dùng thật)
        return {
            risk_score: 0.04,
            risk_level: 'Normal',
            rule_score: 0.0,
            reasons: [],
            window_start_ms: 0,
            window_end_ms: 5000,
        };
    }
    const res = await fetch(`${API_BASE_URL}/detection/latest`);
    return res.json();
}

/**
 * Lấy lịch sử alerts
 */
export async function fetchAlerts(limit = 50): Promise<AlertEntry[]> {
    if (USE_MOCK) {
        // Import dữ liệu cảnh báo thật
        const { recentAlertsData } = await import('data/recent-alerts-data');
        return recentAlertsData as unknown as AlertEntry[];
    }
    const res = await fetch(`${API_BASE_URL}/alerts?limit=${limit}`);
    return res.json();
}

/**
 * Lấy features dataset (từ CSV)
 * Dùng cho: biểu đồ radar, keystroke metrics
 */
export async function fetchFeaturesDataset(): Promise<FeatureVector[]> {
    if (USE_MOCK) {
        return [];  // Dashboard dùng chart-data thật từ dataset
    }
    const res = await fetch(`${API_BASE_URL}/features`);
    return res.json();
}

// ===== WEBSOCKET REALTIME =====

export type RealtimeMessage =
    | { type: 'key_event'; data: KeyEvent }
    | { type: 'feature_vector'; data: FeatureVector }
    | { type: 'detection_result'; data: DetectionResult }
    | { type: 'policy_action'; data: PolicyAction }
    | { type: 'status_update'; data: SystemStatus };

type MessageHandler = (msg: RealtimeMessage) => void;

/**
 * Kết nối WebSocket tới KDS Guard backend
 * Trả về hàm disconnect()
 */
export function connectRealtime(onMessage: MessageHandler): () => void {
    if (USE_MOCK) {
        // Mock: gửi event giả mỗi 2 giây
        const interval = setInterval(() => {
            const mockMsg: RealtimeMessage = {
                type: 'detection_result',
                data: {
                    risk_score: Math.random() * 0.3,
                    risk_level: 'Normal',
                    rule_score: 0,
                    reasons: [],
                    window_start_ms: Date.now() - 5000,
                    window_end_ms: Date.now(),
                },
            };
            onMessage(mockMsg);
        }, 2000);

        return () => clearInterval(interval);
    }

    let ws: WebSocket;

    try {
        ws = new WebSocket(WS_URL);
    } catch {
        onMessage({ type: 'status_update', data: { is_running: false, mode: 'detection', uptime_seconds: 0, total_events: 0, total_windows_analyzed: 0, current_session_id: '', user_id: '' } });
        return () => {};
    }

    ws.onopen = () => {
        onMessage({
            type: 'status_update',
            data: {
                is_running: true,
                mode: 'detection',
                uptime_seconds: 0,
                total_events: 0,
                total_windows_analyzed: 0,
                current_session_id: '',
                user_id: 'ws_bridge',
            },
        });
    };

    ws.onmessage = (event) => {
        try {
            const raw = JSON.parse(event.data) as Record<string, unknown>;
            // Rust engine (main.rs): type "detection" + result { risk_level: "NORMAL", ... }
            if (raw.type === 'detection' && raw.result && typeof raw.result === 'object') {
                const r = raw.result as Record<string, unknown>;
                const reasons = Array.isArray(r.reasons)
                    ? (r.reasons as unknown[]).map(String)
                    : [];
                const mapped: RealtimeMessage = {
                    type: 'detection_result',
                    data: {
                        risk_score: Number(r.risk_score ?? 0),
                        risk_level: mapRustRiskLevel(String(r.risk_level ?? 'NORMAL')),
                        rule_score: Number(r.rule_score ?? 0),
                        reasons,
                        window_start_ms: Number(raw.window_start_ms ?? 0),
                        window_end_ms: Number(raw.window_end_ms ?? 0),
                    },
                };
                onMessage(mapped);
                return;
            }
            onMessage(raw as RealtimeMessage);
        } catch (e) {
            console.error('[KDS Guard WS] Parse error:', e);
        }
    };

    ws.onerror = (e) => {
        console.error('[KDS Guard WS] Connection error:', e);
    };

    ws.onclose = () => {
        console.log('[KDS Guard WS] Disconnected');
    };

    return () => ws.close();
}

// ===== UTILITIES =====

/** Ánh xạ RiskLevel → màu hiển thị */
export function riskLevelColor(level: RiskLevel): string {
    const colors: Record<RiskLevel, string> = {
        Normal: '#4caf50',
        Low: '#2196f3',
        Medium: '#ff9800',
        High: '#f44336',
        Critical: '#d50000',
    };
    return colors[level];
}

/** Ánh xạ RiskLevel → emoji */
export function riskLevelEmoji(level: RiskLevel): string {
    const emojis: Record<RiskLevel, string> = {
        Normal: '✅',
        Low: '🔵',
        Medium: '🟡',
        High: '🟠',
        Critical: '🔴',
    };
    return emojis[level];
}

/**
 * Parse CSV file từ kds_guard output
 * Input: nội dung file keystroke_log_*.csv
 * Output: mảng KeyEvent[]
 */
export function parseKeystrokeCSV(csvContent: string): KeyEvent[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    // Bỏ header
    return lines.slice(1).map((line) => {
        const [timestamp_ms, key_code, event_type, key_class, is_modifier, session_id, user_id] =
            line.split(',');
        return {
            timestamp_ms: parseFloat(timestamp_ms),
            key_code,
            event_type: event_type as 'down' | 'up',
            key_class: key_class as KeyEvent['key_class'],
            is_modifier: is_modifier === 'True' || is_modifier === 'true',
            session_id,
            user_id,
        };
    });
}

/**
 * Parse features CSV (features_dataset.csv)
 * Input: nội dung file features_*.csv
 * Output: mảng FeatureVector[]
 */
export function parseFeaturesCSV(csvContent: string): FeatureVector[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].split(',');

    return lines.slice(1).map((line) => {
        const values = line.split(',');
        const row: Record<string, string> = {};
        header.forEach((col, i) => {
            row[col] = values[i];
        });

        return {
            window_start_ms: parseFloat(row['window_start_ms'] || '0'),
            window_end_ms: parseFloat(row['window_end_ms'] || '0'),
            num_keys: parseInt(row['num_keys'] || '0'),
            mean_hold_time: parseFloat(row['mean_hold_time'] || '0'),
            std_hold_time: parseFloat(row['std_hold_time'] || '0'),
            median_hold_time: parseFloat(row['median_hold_time'] || '0'),
            iqr_hold_time: parseFloat(row['iqr_hold_time'] || '0'),
            mean_flight_time: parseFloat(row['mean_flight_time'] || '0'),
            std_flight_time: parseFloat(row['std_flight_time'] || '0'),
            median_flight_time: parseFloat(row['median_flight_time'] || '0'),
            iqr_flight_time: parseFloat(row['iqr_flight_time'] || '0'),
            cv_flight_time: parseFloat(row['cv_flight_time'] || '0'),
            typing_speed: parseFloat(row['typing_speed'] || '0'),
            modifier_ratio: parseFloat(row['modifier_ratio'] || '0'),
            special_ratio: parseFloat(row['special_ratio'] || '0'),
            has_burst: row['has_burst'] === 'True' || row['has_burst'] === 'true',
            max_burst_length: parseInt(row['max_burst_length'] || '0'),
            min_flight_time: parseFloat(row['min_flight_time'] || '0'),
            p5_flight_time: parseFloat(row['p5_flight_time'] || '0'),
            p95_flight_time: parseFloat(row['p95_flight_time'] || '0'),
        };
    });
}
