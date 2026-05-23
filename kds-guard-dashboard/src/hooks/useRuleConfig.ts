/**
 * KDS Guard — Rule Configuration Hook
 * Quản lý trạng thái bật/tắt từng rule với localStorage persistence.
 * Các rule đang enabled sẽ được áp dụng trong engine detection.
 */

import { useState, useEffect, useCallback } from 'react';

export interface RuleConfig {
  id: string;
  enabled: boolean;
}

const STORAGE_KEY = 'kds_guard_rule_config';

const ALL_RULE_IDS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];

function loadRuleConfig(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, boolean>;
      // Ensure all rule IDs exist
      const result: Record<string, boolean> = {};
      for (const id of ALL_RULE_IDS) {
        result[id] = parsed[id] ?? true;
      }
      return result;
    }
  } catch {
    // ignore
  }
  // Default: all rules enabled
  const result: Record<string, boolean> = {};
  for (const id of ALL_RULE_IDS) {
    result[id] = true;
  }
  return result;
}

function saveRuleConfig(config: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore quota errors
  }
}

export function useRuleConfig() {
  const [enabledRules, setEnabledRules] = useState<Record<string, boolean>>(
    () => loadRuleConfig() as Record<string, boolean>,
  );

  useEffect(() => {
    saveRuleConfig(enabledRules);
  }, [enabledRules]);

  const toggleRule = useCallback((ruleId: string, enabled: boolean) => {
    setEnabledRules((prev) => ({ ...prev, [ruleId]: enabled }));
  }, []);

  const isRuleEnabled = useCallback(
    (ruleId: string): boolean => {
      return enabledRules[ruleId] ?? true;
    },
    [enabledRules],
  );

  const getEnabledRuleIds = useCallback((): string[] => {
    return ALL_RULE_IDS.filter((id) => enabledRules[id] !== false);
  }, [enabledRules]);

  const resetAllRules = useCallback(() => {
    const defaults: Record<string, boolean> = {};
    for (const id of ALL_RULE_IDS) {
      defaults[id] = true;
    }
    setEnabledRules(defaults);
  }, []);

  const getRuleCount = useCallback((): { enabled: number; total: number } => {
    const enabled = Object.values(enabledRules).filter(Boolean).length;
    return { enabled, total: ALL_RULE_IDS.length };
  }, [enabledRules]);

  // Build summary text for IPC to engine
  const getEngineConfigSummary = useCallback((): string => {
    const enabled = getEnabledRuleIds();
    return `rules=${enabled.join('+')}|total=${enabled.length}/${ALL_RULE_IDS.length}`;
  }, [getEnabledRuleIds]);

  return {
    enabledRules,
    toggleRule,
    isRuleEnabled,
    getEnabledRuleIds,
    resetAllRules,
    getRuleCount,
    getEngineConfigSummary,
  };
}
