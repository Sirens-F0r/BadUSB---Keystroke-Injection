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

  return <Outlet />;
};

export default App;
