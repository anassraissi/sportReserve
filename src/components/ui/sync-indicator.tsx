import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useDataSync } from '@/contexts/DataSyncContext';
import { cn } from '@/lib/utils';

export const SyncIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const { isRefreshing, lastUpdate } = useDataSync();

  if (!isRefreshing) return null;

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <RefreshCw className="h-3 w-3 animate-spin" />
      <span>Mise à jour des données...</span>
    </div>
  );
};

export const LastSyncTime: React.FC<{ className?: string }> = ({ className }) => {
  const { lastUpdate } = useDataSync();
  const [relativeTime, setRelativeTime] = React.useState('');

  React.useEffect(() => {
    const updateRelativeTime = () => {
      const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
      if (seconds < 5) {
        setRelativeTime('À l\'instant');
      } else if (seconds < 60) {
        setRelativeTime(`Il y a ${seconds}s`);
      } else if (seconds < 3600) {
        setRelativeTime(`Il y a ${Math.floor(seconds / 60)}min`);
      } else {
        setRelativeTime(`Il y a ${Math.floor(seconds / 3600)}h`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return (
    <div className={cn("text-xs text-muted-foreground", className)}>
      <span>{relativeTime}</span>
    </div>
  );
};
