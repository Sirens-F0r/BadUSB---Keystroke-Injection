import { useEffect, useRef, useState, useCallback } from 'react';
import {
  connectRealtime,
  type RealtimeMessage,
  type DetectionResult,
  type FeatureVector,
  type SystemStatus,
  type KeyEvent,
} from 'services/kds-guard-api';

export interface RealtimeState {
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  latestDetection: DetectionResult | null;
  latestFeature: FeatureVector | null;
  latestKeyEvent: KeyEvent | null;
  systemStatus: SystemStatus | null;
  eventHistory: RealtimeMessage[];
  isConnected: boolean;
}

const MAX_HISTORY = 50;

export function useRealtime(enabled = true) {
  const [state, setState] = useState<RealtimeState>({
    connectionStatus: enabled ? 'connecting' : 'disconnected',
    latestDetection: null,
    latestFeature: null,
    latestKeyEvent: null,
    systemStatus: null,
    eventHistory: [],
    isConnected: false,
  });

    const disconnectRef = useRef<(() => void) | null>(null);

  const handleMessage = useCallback((msg: RealtimeMessage) => {
    setState((prev) => {
      const history = [msg, ...prev.eventHistory].slice(0, MAX_HISTORY);
      return {
        ...prev,
        connectionStatus: 'connected',
        eventHistory: history,
        latestDetection: msg.type === 'detection_result' ? msg.data : prev.latestDetection,
        latestFeature: msg.type === 'feature_vector' ? msg.data : prev.latestFeature,
        latestKeyEvent: msg.type === 'key_event' ? msg.data : prev.latestKeyEvent,
        systemStatus: msg.type === 'status_update' ? msg.data : prev.systemStatus,
      };
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (disconnectRef.current) {
        disconnectRef.current();
        disconnectRef.current = null;
      }
      setState((prev) => ({
        ...prev,
        connectionStatus: 'disconnected',
        isConnected: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, connectionStatus: 'connecting' }));
    disconnectRef.current = connectRealtime(handleMessage);

    return () => {
      if (disconnectRef.current) {
        disconnectRef.current();
        disconnectRef.current = null;
      }
      setState((prev) => ({ ...prev, connectionStatus: 'disconnected', isConnected: false }));
    };
  }, [enabled, handleMessage]);

  return state;
}
