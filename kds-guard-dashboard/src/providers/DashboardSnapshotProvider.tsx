import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import type { DashboardSnapshot } from 'types/dashboard-snapshot';
import bundledSnapshot from 'data/dashboard_snapshot.json';

const bundled = bundledSnapshot as DashboardSnapshot;

const DashboardSnapshotContext = createContext<DashboardSnapshot>(bundled);

export function DashboardSnapshotProvider({ children }: PropsWithChildren): ReactElement {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(bundled);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return undefined;
    }

    let cancelled = false;
    const pollMs = Number(import.meta.env.VITE_SNAPSHOT_POLL_MS) || 15000;

    const load = async () => {
      try {
        const r = await fetch(`/api/dashboard-snapshot?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!r.ok) return;
        const data = (await r.json()) as DashboardSnapshot;
        if (!cancelled && data?.systemOverview?.metrics?.length) {
          setSnapshot(data);
        }
      } catch {
        /* giữ bản bundle build */
      }
    };

    void load();
    const id = window.setInterval(() => void load(), pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <DashboardSnapshotContext.Provider value={snapshot}>{children}</DashboardSnapshotContext.Provider>
  );
}

export function useDashboardSnapshot(): DashboardSnapshot {
  return useContext(DashboardSnapshotContext);
}
