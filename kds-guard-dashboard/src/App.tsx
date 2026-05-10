import { ReactElement, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useRealtimeStream } from 'hooks/useKdsGuard';
import { useWindowsNotification } from 'hooks/useWindowsNotification';

const App = (): ReactElement => {
  const { latestDetection } = useRealtimeStream();
  const { notify } = useWindowsNotification();

  // Auto-trigger Windows notification khi realtime stream phát hiện risk cao
  useEffect(() => {
    if (latestDetection) {
      notify(latestDetection);
    }
  }, [latestDetection, notify]);

  // Gửi detection update lên Electron main process (system tray + native notification)
  useEffect(() => {
    if (!latestDetection) return;

    const riskLevel = latestDetection.risk_level;
    if (riskLevel === 'High' || riskLevel === 'Critical') {
      window.electronAPI?.sendDetectionUpdate({
        riskLevel,
        riskScore: latestDetection.risk_score,
        reasons: latestDetection.reasons,
      });
    }
  }, [latestDetection]);

  return <Outlet />;
};

export default App;
