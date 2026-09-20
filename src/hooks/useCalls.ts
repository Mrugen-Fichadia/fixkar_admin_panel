import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  deleteDoc,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface CallRecord {
  id: string;
  callId?: string;
  jobId?: string;
  callerId?: string;
  callerName?: string;
  callerRole?: string;
  callerPhoto?: string;
  receiverId?: string;
  receiverName?: string;
  receiverRole?: string;
  receiverPhoto?: string;
  callType?: 'audio' | 'video' | 'voice_note' | string;
  status?: 'connected' | 'missed' | 'declined' | 'calling' | 'ringing' | 'ended' | 'voice_note' | string;
  videoPermission?: 'pending' | 'approved' | 'declined' | string;
  duration?: number;
  durationFormatted?: string;
  recordingUrl?: string;
  audioUrl?: string;
  voiceNoteUrl?: string;
  callRecordingUrl?: string;
  recording_url?: string;
  createdAt?: Timestamp | Date | string | null;
  startedAt?: Timestamp | Date | string | null;
  endedAt?: Timestamp | Date | string | null;
  senderId?: string;
  [key: string]: any;
}

/**
 * Extract audio recording URL across various field name variants
 */
export const getCallAudioUrl = (record?: Partial<CallRecord> | null): string | undefined => {
  if (!record) return undefined;
  const url =
    record.recordingUrl ||
    record.audioUrl ||
    record.voiceNoteUrl ||
    record.callRecordingUrl ||
    record.recording_url;
  return typeof url === 'string' && url.trim().length > 0 ? url.trim() : undefined;
};

const parseRecordTimestamp = (val: any): number => {
  if (!val) return 0;
  if (val.toMillis) return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  if (val instanceof Date) return val.getTime();
  const parsed = new Date(val).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

const parseCallRecord = (docSnap: any): CallRecord => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    callId: data.callId || docSnap.id,
    jobId: data.jobId || data.job_id || '',
    callerId: data.callerId || data.caller_id || data.senderId || '',
    callerName: data.callerName || data.caller_name || 'User',
    callerRole: data.callerRole || data.caller_role || 'Customer',
    callerPhoto: data.callerPhoto || data.caller_photo || '',
    receiverId: data.receiverId || data.receiver_id || '',
    receiverName: data.receiverName || data.receiver_name || 'User',
    receiverRole: data.receiverRole || data.receiver_role || 'Worker',
    receiverPhoto: data.receiverPhoto || data.receiver_photo || '',
    callType: data.callType || data.call_type || 'audio',
    status: data.status || 'calling',
    videoPermission: data.videoPermission || data.video_permission || 'pending',
    duration: typeof data.duration === 'number' ? data.duration : 0,
    durationFormatted: data.durationFormatted || data.duration_formatted,
    recordingUrl: data.recordingUrl || data.audioUrl || data.voiceNoteUrl || data.callRecordingUrl || data.recording_url,
    audioUrl: data.audioUrl,
    voiceNoteUrl: data.voiceNoteUrl,
    callRecordingUrl: data.callRecordingUrl,
    recording_url: data.recording_url,
    createdAt: data.createdAt || data.created_at,
    startedAt: data.startedAt || data.started_at,
    endedAt: data.endedAt || data.ended_at,
    ...data,
  };
};

/**
 * Hook to stream all Call Logs & Voice Notes across the platform
 */
export const useCallRecords = () => {
  const [records, setRecords] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const callLogsRef = collection(db, 'call_logs');
    const callsRef = collection(db, 'calls');
    const voiceNotesRef = collection(db, 'voice_notes');

    const cache = {
      callLogs: new Map<string, CallRecord>(),
      calls: new Map<string, CallRecord>(),
      voiceNotes: new Map<string, CallRecord>(),
    };

    const updateMergedList = () => {
      const mergedMap = new Map<string, CallRecord>();

      // Order of precedence: call_logs > voice_notes > calls
      cache.calls.forEach((val, key) => mergedMap.set(key, val));
      cache.voiceNotes.forEach((val, key) => mergedMap.set(key, val));
      cache.callLogs.forEach((val, key) => mergedMap.set(key, val));

      const list = Array.from(mergedMap.values());
      list.sort((a, b) => {
        const timeA = parseRecordTimestamp(a.createdAt || a.startedAt);
        const timeB = parseRecordTimestamp(b.createdAt || b.startedAt);
        return timeB - timeA;
      });

      setRecords(list);
      setLoading(false);
      setError(null);
    };

    const unsubCallLogs = onSnapshot(
      callLogsRef,
      (snapshot) => {
        cache.callLogs.clear();
        snapshot.docs.forEach((docSnap) => {
          cache.callLogs.set(docSnap.id, parseCallRecord(docSnap));
        });
        updateMergedList();
      },
      (err) => {
        console.error('Error listening to call_logs:', err);
        setError('Failed to fetch call records');
        setLoading(false);
      }
    );

    const unsubCalls = onSnapshot(
      callsRef,
      (snapshot) => {
        cache.calls.clear();
        snapshot.docs.forEach((docSnap) => {
          cache.calls.set(docSnap.id, parseCallRecord(docSnap));
        });
        updateMergedList();
      },
      (err) => {
        console.warn('Auxiliary calls snapshot warning:', err);
      }
    );

    const unsubVoiceNotes = onSnapshot(
      voiceNotesRef,
      (snapshot) => {
        cache.voiceNotes.clear();
        snapshot.docs.forEach((docSnap) => {
          cache.voiceNotes.set(docSnap.id, parseCallRecord(docSnap));
        });
        updateMergedList();
      },
      (err) => {
        console.warn('Auxiliary voice_notes snapshot warning:', err);
      }
    );

    return () => {
      unsubCallLogs();
      unsubCalls();
      unsubVoiceNotes();
    };
  }, []);

  const deleteCallRecord = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Delete from call_logs
      await deleteDoc(doc(db, 'call_logs', id));
      // Try deleting from calls and voice_notes if present
      try {
        await deleteDoc(doc(db, 'calls', id));
      } catch {}
      try {
        await deleteDoc(doc(db, 'voice_notes', id));
      } catch {}

      setRecords((prev) => prev.filter((r) => r.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting call record:', err);
      return { success: false, error: err?.message || 'Failed to delete call record' };
    }
  }, []);

  return { records, loading, error, deleteCallRecord };
};

/**
 * Hook to stream calls for a specific Job ID
 */
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
        const list: CallRecord[] = snapshot.docs.map((docSnap) => parseCallRecord(docSnap));

        list.sort((a, b) => {
          const timeA = parseRecordTimestamp(a.createdAt || a.startedAt);
          const timeB = parseRecordTimestamp(b.createdAt || b.startedAt);
          return timeB - timeA;
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
