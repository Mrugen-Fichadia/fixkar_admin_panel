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

export interface UserLookup {
  name: string;
  role?: string;
  photo?: string;
  phone?: string;
}

const parseCallRecord = (docSnap: any, usersMap?: Map<string, UserLookup>): CallRecord => {
  const data = docSnap.data() || {};
  const callerId = data.callerId || data.caller_id || data.senderId || '';
  const receiverId = data.receiverId || data.receiver_id || '';

  const callerUser = usersMap ? (usersMap.get(callerId) || null) : null;
  const receiverUser = usersMap ? (usersMap.get(receiverId) || null) : null;

  // Resolve caller info
  let callerName = callerUser?.name || data.callerName || data.caller_name || '';
  let callerRole = callerUser?.role || data.callerRole || data.caller_role || '';
  let callerPhoto = callerUser?.photo || data.callerPhoto || data.caller_photo || '';

  // Resolve receiver info
  let receiverName = receiverUser?.name || data.receiverName || data.receiver_name || '';
  let receiverRole = receiverUser?.role || data.receiverRole || data.receiver_role || '';
  let receiverPhoto = receiverUser?.photo || data.receiverPhoto || data.receiver_photo || '';

  // Fallbacks if role is still empty
  if (!callerRole) {
    callerRole = data.callType === 'voice_note' ? 'Sender' : 'Customer';
  }
  if (!receiverRole) {
    receiverRole = data.callType === 'voice_note' ? 'Recipient' : 'Worker';
  }

  // Fallback names ensuring distinct display if same or missing
  if (!callerName || callerName === 'User') {
    if (callerId) {
      callerName = `${callerRole} (${callerId.slice(0, 6)})`;
    } else {
      callerName = callerRole;
    }
  }

  if (!receiverName || receiverName === 'User') {
    if (receiverId) {
      receiverName = `${receiverRole} (${receiverId.slice(0, 6)})`;
    } else {
      receiverName = receiverRole;
    }
  }

  // If caller and receiver have different IDs but resolved to the exact same name, clarify by role
  if (callerId && receiverId && callerId !== receiverId && callerName === receiverName) {
    callerName = `${callerName} (${callerRole})`;
    receiverName = `${receiverName} (${receiverRole})`;
  }

  return {
    id: docSnap.id,
    callId: data.callId || docSnap.id,
    jobId: data.jobId || data.job_id || '',
    callerId,
    callerName,
    callerRole,
    callerPhoto,
    receiverId,
    receiverName,
    receiverRole,
    receiverPhoto,
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
    const usersRef = collection(db, 'users');
    const karigarsRef = collection(db, 'karigars');

    const cache = {
      callLogs: new Map<string, any>(),
      calls: new Map<string, any>(),
      voiceNotes: new Map<string, any>(),
      users: new Map<string, UserLookup>(),
    };

    const updateMergedList = () => {
      const mergedMap = new Map<string, any>();

      // Order of precedence: call_logs > voice_notes > calls
      cache.calls.forEach((val, key) => mergedMap.set(key, val));
      cache.voiceNotes.forEach((val, key) => mergedMap.set(key, val));
      cache.callLogs.forEach((val, key) => mergedMap.set(key, val));

      const list: CallRecord[] = [];
      mergedMap.forEach((docSnap) => {
        list.push(parseCallRecord(docSnap, cache.users));
      });

      list.sort((a, b) => {
        const timeA = parseRecordTimestamp(a.createdAt || a.startedAt);
        const timeB = parseRecordTimestamp(b.createdAt || b.startedAt);
        return timeB - timeA;
      });

      setRecords(list);
      setLoading(false);
      setError(null);
    };

    // Listen to users collection
    const unsubUsers = onSnapshot(
      usersRef,
      (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const userObj: UserLookup = {
            name: data.name || data.fullName || data.userName || '',
            role: data.role || (data.isKarigar || data.service ? 'Worker' : 'Customer'),
            photo: data.profilePic || data.profileImage || data.photoUrl || '',
            phone: data.phone || data.phoneNumber || '',
          };
          cache.users.set(docSnap.id, userObj);
          if (data.uid && data.uid !== docSnap.id) {
            cache.users.set(data.uid, userObj);
          }
        });
        updateMergedList();
      },
      (err) => console.warn('Users collection listener notice:', err)
    );

    // Listen to karigars collection
    const unsubKarigars = onSnapshot(
      karigarsRef,
      (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const userObj: UserLookup = {
            name: data.name || data.fullName || data.userName || '',
            role: 'Worker',
            photo: data.profilePic || data.profileImage || data.photoUrl || '',
            phone: data.phone || data.phoneNumber || '',
          };
          cache.users.set(docSnap.id, userObj);
          if (data.uid && data.uid !== docSnap.id) {
            cache.users.set(data.uid, userObj);
          }
        });
        updateMergedList();
      },
      (err) => console.warn('Karigars collection listener notice:', err)
    );

    const unsubCallLogs = onSnapshot(
      callLogsRef,
      (snapshot) => {
        cache.callLogs.clear();
        snapshot.docs.forEach((docSnap) => {
          cache.callLogs.set(docSnap.id, docSnap);
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
          cache.calls.set(docSnap.id, docSnap);
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
          cache.voiceNotes.set(docSnap.id, docSnap);
        });
        updateMergedList();
      },
      (err) => {
        console.warn('Auxiliary voice_notes snapshot warning:', err);
      }
    );

    return () => {
      unsubUsers();
      unsubKarigars();
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
    const usersRef = collection(db, 'users');
    const karigarsRef = collection(db, 'karigars');
    const q = query(callsRef, where('jobId', '==', jobId));

    const usersMap = new Map<string, UserLookup>();

    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const userObj: UserLookup = {
          name: data.name || data.fullName || '',
          role: data.role || 'Customer',
          photo: data.profilePic || data.profileImage || '',
        };
        usersMap.set(docSnap.id, userObj);
        if (data.uid) usersMap.set(data.uid, userObj);
      });
    });

    const unsubKarigars = onSnapshot(karigarsRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const userObj: UserLookup = {
          name: data.name || data.fullName || '',
          role: 'Worker',
          photo: data.profilePic || data.profileImage || '',
        };
        usersMap.set(docSnap.id, userObj);
        if (data.uid) usersMap.set(data.uid, userObj);
      });
    });

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CallRecord[] = snapshot.docs.map((docSnap) => parseCallRecord(docSnap, usersMap));

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

    return () => {
      unsubUsers();
      unsubKarigars();
      unsubscribe();
    };
  }, [jobId]);

  return { calls, loading, error };
};
