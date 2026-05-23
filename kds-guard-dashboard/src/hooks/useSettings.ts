/**
 * KDS Guard Settings Hook
 * Quản lý trạng thái settings với localStorage persistence.
 * Các thay đổi được lưu tự động và áp dụng ngay lập tức.
 */

import { useState, useEffect, useCallback } from 'react';

export interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface ThresholdSetting {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  unit: string;
  step: number;
}

export interface AppSettings {
  toggles: ToggleSetting[];
  thresholds: ThresholdSetting[];
}

const STORAGE_KEY = 'kds_guard_settings';

const DEFAULT_TOGGLES: ToggleSetting[] = [
  {
    id: 'realtime',
    label: 'Giám sát thời gian thực',
    description: 'Liên tục giám sát động học gõ phím để phát hiện bất thường',
    enabled: true,
  },
  {
    id: 'soft_block',
    label: 'Chặn input khi bị tấn công',
    description: 'Tự động tạm dừng nhập liệu khi phát hiện tấn công',
    enabled: true,
  },
  {
    id: 'challenge',
    label: 'Chế độ xác minh',
    description: 'Yêu cầu xác minh danh tính khi điểm rủi ro vượt ngưỡng',
    enabled: false,
  },
  {
    id: 'auto_log',
    label: 'Ghi log tự động',
    description: 'Ghi lại tất cả sự kiện và kết quả phân tích',
    enabled: true,
  },
  {
    id: 'enhanced',
    label: 'Giám sát nâng cao thiết bị mới',
    description: 'Tăng tần suất phân tích khi có thiết bị HID mới kết nối',
    enabled: true,
  },
  {
    id: 'notifications',
    label: 'Thông báo hệ thống',
    description: 'Hiển thị thông báo cho các cảnh báo bảo mật',
    enabled: true,
  },
];

const DEFAULT_THRESHOLDS: ThresholdSetting[] = [
  {
    id: 'risk',
    label: 'Ngưỡng cảnh báo rủi ro',
    min: 0,
    max: 1,
    value: 0.3,
    unit: '',
    step: 0.05,
  },
  {
    id: 'window',
    label: 'Kích thước cửa sổ phân tích',
    min: 20,
    max: 200,
    value: 40,
    unit: ' phím',
    step: 10,
  },
  {
    id: 'rules',
    label: 'Số luật tối thiểu để cảnh báo',
    min: 1,
    max: 8,
    value: 2,
    unit: ' luật',
    step: 1,
  },
  {
    id: 'block',
    label: 'Ngưỡng tự động chặn',
    min: 0,
    max: 1,
    value: 0.85,
    unit: '',
    step: 0.05,
  },
];

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AppSettings>;
      return {
        toggles: parsed.toggles ?? DEFAULT_TOGGLES,
        thresholds: parsed.thresholds ?? DEFAULT_THRESHOLDS,
      };
    }
  } catch {
    // ignore parse errors
  }
  return {
    toggles: DEFAULT_TOGGLES,
    thresholds: DEFAULT_THRESHOLDS,
  };
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Auto-save whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const toggleSetting = useCallback((id: string, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      toggles: prev.toggles.map((t) => (t.id === id ? { ...t, enabled } : t)),
    }));
  }, []);

  const setThreshold = useCallback((id: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      thresholds: prev.thresholds.map((t) => (t.id === id ? { ...t, value } : t)),
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings({
      toggles: DEFAULT_TOGGLES,
      thresholds: DEFAULT_THRESHOLDS,
    });
  }, []);

  const getDetectorConfig = useCallback(() => {
    const t = settings.thresholds;
    const risk = t.find((x) => x.id === 'risk')?.value ?? 0.3;
    const block = t.find((x) => x.id === 'block')?.value ?? 0.85;
    const rules = t.find((x) => x.id === 'rules')?.value ?? 2;
    return { risk, block, rules };
  }, [settings.thresholds]);

  const isEnabled = useCallback(
    (id: string): boolean => {
      return settings.toggles.find((t) => t.id === id)?.enabled ?? false;
    },
    [settings.toggles],
  );

  return {
    settings,
    toggleSetting,
    setThreshold,
    resetToDefaults,
    getDetectorConfig,
    isEnabled,
  };
}
