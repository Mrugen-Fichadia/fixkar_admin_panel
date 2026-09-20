import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface CallRecord {
  id: string;
  jobId: string;
  callerId: string;
  callerName: string;
  callerRole?: string;
  callerPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverRole?: string;
  receiverPhoto?: string;
  callType: 'audio' | 'video' | string;
  status: 'connected' | 'missed' | 'declined' | 'calling' | 'ended' | string;
  duration?: number;
  durationFormatted?: string;
  recordingUrl?: string;
  createdAt?: Timestamp | Date | string | null;
  startedAt?: Timestamp | Date | string | null;
  endedAt?: Timestamp | Date | string | null;
}

export const useJobCalls = (jobId?: string) => {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setCalls([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const callsRef = collection(db, 'call_logs');
    const q = query(callsRef, where('jobId', '==', jobId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CallRecord[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<CallRecord, 'id'>),
        }));

        list.sort((a, b) => {
          const getTime = (val: any) => {
            if (!val) return 0;
            if (val.toMillis) return val.toMillis();
            if (val.seconds) return val.seconds * 1000;
            return new Date(val).getTime() || 0;
          };
          return getTime(b.createdAt) - getTime(a.createdAt);
        });

        setCalls(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching job calls:', err);
        setError('Failed to fetch call records');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [jobId]);

  return { calls, loading, error };
};
