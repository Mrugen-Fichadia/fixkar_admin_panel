import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface BlockedUserRecord {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRole: 'Customer' | 'Worker' | string;
  title: string;
  message: string;
  violationReason: string;
  executionTime: 'Immediate' | 'After 24 Hours' | 'After 15 Days';
  blockType: 'Temporary' | 'Permanent';
  blockDuration?: string | null;
  status: 'Active Block' | 'Scheduled Block' | 'Unblocked';
  blockedAt?: string | null;
  scheduledBlockDate?: string | null;
  unblockDate?: string | null;
  createdAt?: unknown;
}

export const useBlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const blockedRef = collection(db, 'blocked_users');
      const q = query(blockedRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as BlockedUserRecord[];
      setBlockedUsers(records);
    } catch (err) {
      console.error('Error fetching blocked users:', err);
      // Fallback query if orderBy index is missing
      try {
        const blockedRef = collection(db, 'blocked_users');
        const snapshot = await getDocs(blockedRef);
        const records = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as BlockedUserRecord[];
        setBlockedUsers(records);
      } catch (innerErr) {
        setError('Failed to fetch blocked users list');
        console.error('Fallback error fetching blocked users:', innerErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (blockedRecordId: string, userId: string) => {
    try {
      // 1. Update blocked_users document status
      if (blockedRecordId) {
        const blockedDocRef = doc(db, 'blocked_users', blockedRecordId);
        await updateDoc(blockedDocRef, {
          status: 'Unblocked',
          unblockedAt: new Date().toISOString(),
        });
      }

      // 2. Update target user document in users collection
      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
          isActive: true,
          isBlocked: false,
          scheduledBlockDate: null,
          unblockedAt: new Date().toISOString(),
        });
      }

      await fetchBlockedUsers();
      return { success: true };
    } catch (err) {
      console.error('Error unblocking user:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to unblock user' };
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  return {
    blockedUsers,
    loading,
    error,
    refreshBlockedUsers: fetchBlockedUsers,
    unblockUser,
  };
};
