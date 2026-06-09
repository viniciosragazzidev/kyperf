"use client"

import { useState, useEffect, useCallback } from 'react';
import { getPendingActions, removePendingAction } from '@/lib/offline-sync';
import { toast } from 'sonner';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    const actions = await getPendingActions();
    if (actions.length === 0) return;

    setIsSyncing(true);
    toast.info(`Sincronizando ${actions.length} alterações pendentes...`);

    try {
      for (const action of actions) {
        // Here you would call your actual API or Server Action
        // For this implementation, we simulate the sync logic
        console.log('Syncing action:', action);
        
        // Simulating a successful sync for each action
        // await performSyncAction(action);
        
        if (action.id) {
          await removePendingAction(action.id);
        }
      }
      toast.success('Sincronização concluída!');
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Falha na sincronização. Tentaremos novamente mais tarde.');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      sync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync]);

  return { isOnline, isSyncing, sync };
}
