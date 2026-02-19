import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getOfflineNotes, getOfflineNoteById } from '../services/offline/database';

export function useIsOffline() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return isOffline;
}

export function useOfflineNotes(binderId?: string, type?: string) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOfflineNotes(binderId, type)
      .then((result) => {
        if (!cancelled) setNotes(result);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [binderId, type]);

  return { notes, loading };
}

export function useOfflineNoteDetail(noteId: string) {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOfflineNoteById(noteId)
      .then((result) => {
        if (!cancelled) setNote(result);
      })
      .catch(() => {
        if (!cancelled) setNote(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  return { note, loading };
}
