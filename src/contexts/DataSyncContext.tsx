import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { bookingsAPI, resourcesAPI } from '@/lib/api';

interface DataSyncContextType {
  lastUpdate: number;
  triggerRefresh: (type?: 'reservations' | 'resources' | 'all') => void;
  reservationsVersion: number;
  resourcesVersion: number;
  isRefreshing: boolean;
  checkForUpdates: () => Promise<void>;
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

const CHECK_INTERVAL = 30000; // Check every 30 seconds (reduced from 5s)

export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [reservationsVersion, setReservationsVersion] = useState(0);
  const [resourcesVersion, setResourcesVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastReservationsCount = useRef<number>(0);
  const lastResourcesCount = useRef<number>(0);

  const checkForUpdates = useCallback(async () => {
    try {
      // Check reservations
      const reservationsRes = await bookingsAPI.getAll({ page: 1, limit: 1 });
      const currentReservationsCount = reservationsRes.pagination?.total || reservationsRes.reservations?.length || 0;
      
      if (lastReservationsCount.current !== 0 && currentReservationsCount !== lastReservationsCount.current) {
        setReservationsVersion(prev => prev + 1);
        setLastUpdate(Date.now());
      }
      lastReservationsCount.current = currentReservationsCount;

      // Check resources
      const resourcesRes = await resourcesAPI.getAll({ page: 1, limit: 1 });
      const currentResourcesCount = resourcesRes.pagination?.total || resourcesRes.resources?.length || 0;
      
      if (lastResourcesCount.current !== 0 && currentResourcesCount !== lastResourcesCount.current) {
        setResourcesVersion(prev => prev + 1);
        setLastUpdate(Date.now());
      }
      lastResourcesCount.current = currentResourcesCount;
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.debug('Data sync check failed:', error);
    }
  }, []);

  const triggerRefresh = useCallback((type: 'reservations' | 'resources' | 'all' = 'all') => {
    setIsRefreshing(true);
    
    if (type === 'reservations' || type === 'all') {
      setReservationsVersion(prev => prev + 1);
    }
    
    if (type === 'resources' || type === 'all') {
      setResourcesVersion(prev => prev + 1);
    }
    
    setLastUpdate(Date.now());
    
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  // Set up event listeners only (no periodic polling)
  useEffect(() => {
    // Only check when tab becomes visible again after being hidden
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Small delay to avoid immediate check
        setTimeout(checkForUpdates, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkForUpdates]);

  const value = {
    lastUpdate,
    triggerRefresh,
    reservationsVersion,
    resourcesVersion,
    isRefreshing,
    checkForUpdates,
  };

  return <DataSyncContext.Provider value={value}>{children}</DataSyncContext.Provider>;
};

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (context === undefined) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};
