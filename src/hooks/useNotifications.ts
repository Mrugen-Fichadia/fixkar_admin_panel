import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { User } from './useUsers';

export interface SendWarningParams {
  user: User;
  title: string;
  message: string;
  violationReason: string;
  executionTime: 'Immediate' | 'After 24 Hours' | 'After 15 Days' | 'Custom Date' | string;
  customExecutionDate?: string;
  blockType: 'Temporary' | 'Permanent';
  blockDuration?: '1 Month' | '3 Months' | '6 Months' | string; // e.g. custom date or string
}

export const useNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendWarningAndBlock = async (params: SendWarningParams) => {
    const { user, title, message, violationReason, executionTime, customExecutionDate, blockType, blockDuration } = params;

    if (!user.id && !user.uid) {
      return { success: false, error: 'Invalid user ID' };
    }

    const userId = user.id || user.uid || '';

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      let scheduledBlockDate: Date | null = null;
      let unblockDate: Date | null = null;

      // Calculate scheduled block date if execution is delayed
      if (executionTime === 'After 24 Hours') {
        scheduledBlockDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (executionTime === 'After 15 Days') {
        scheduledBlockDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      } else if (executionTime === 'Custom Date' && customExecutionDate) {
        scheduledBlockDate = new Date(customExecutionDate);
      }

      // Calculate unblock date if temporary
      const blockEffectiveStart = scheduledBlockDate || now;
      if (blockType === 'Temporary') {
        if (blockDuration === '1 Month') {
          unblockDate = new Date(blockEffectiveStart);
          unblockDate.setMonth(unblockDate.getMonth() + 1);
        } else if (blockDuration === '3 Months') {
          unblockDate = new Date(blockEffectiveStart);
          unblockDate.setMonth(unblockDate.getMonth() + 3);
        } else if (blockDuration === '6 Months') {
          unblockDate = new Date(blockEffectiveStart);
          unblockDate.setMonth(unblockDate.getMonth() + 6);
        } else if (blockDuration) {
          unblockDate = new Date(blockDuration);
        }
      }

      const isImmediate = executionTime === 'Immediate';

      // 1. Add notification to sub-collection: users/{userId}/notifications
      const userNotificationsRef = collection(db, 'users', userId, 'notifications');
      await addDoc(userNotificationsRef, {
        title,
        message,
        type: 'warning',
        isRead: false,
        fcmToken: user.fcmToken || null,
        violationReason,
        blockType,
        blockDuration: blockDuration || null,
        executionTime,
        unblockDate: unblockDate ? unblockDate.toISOString() : null,
        createdAt: serverTimestamp(),
      });

      // 2. Update user document in 'users' collection
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        isActive: isImmediate ? false : user.isActive ?? true,
        isBlocked: isImmediate,
        hasWarning: true,
        lastWarningReason: violationReason,
        blockType,
        blockDuration: blockDuration || null,
        executionTime,
        blockedAt: isImmediate ? now.toISOString() : null,
        scheduledBlockDate: scheduledBlockDate ? scheduledBlockDate.toISOString() : null,
        unblockDate: unblockDate ? unblockDate.toISOString() : null,
        updatedAt: serverTimestamp(),
      });

      // 3. Save entry to global 'blocked_users' collection
      const blockedUsersRef = collection(db, 'blocked_users');
      await addDoc(blockedUsersRef, {
        userId,
        userName: user.name || 'Unknown',
        userEmail: user.email || 'N/A',
        userPhone: user.phone || 'N/A',
        userRole: user.role || 'Customer',
        fcmToken: user.fcmToken || null,
        title,
        message,
        violationReason,
        executionTime,
        blockType,
        blockDuration: blockDuration || null,
        status: isImmediate ? 'Active Block' : 'Scheduled Block',
        blockedAt: isImmediate ? now.toISOString() : null,
        scheduledBlockDate: scheduledBlockDate ? scheduledBlockDate.toISOString() : null,
        unblockDate: unblockDate ? unblockDate.toISOString() : null,
        createdAt: serverTimestamp(),
      });

      return { success: true };
    } catch (err) {
      console.error('Error sending warning/block:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to send notification and block user';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendWarningAndBlock,
    loading,
    error,
  };
};
