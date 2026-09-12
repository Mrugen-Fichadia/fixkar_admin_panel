import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface SupportSettings {
  callingNumber: string;
  callingHours: string;
  callingTitle: string;
  isCallingActive: boolean;
  whatsappNumber: string;
  whatsappSubtitle: string;
  whatsappTitle: string;
  whatsappDefaultMessage: string;
  isWhatsappActive: boolean;
  updatedAt?: any;
}

export const DEFAULT_SUPPORT_SETTINGS: SupportSettings = {
  callingNumber: '',
  callingHours: '10 AM - 7 PM',
  callingTitle: 'Call Helpline',
  isCallingActive: true,
  whatsappNumber: '',
  whatsappSubtitle: 'Instant Reply',
  whatsappTitle: 'Chat on WhatsApp',
  whatsappDefaultMessage: 'Hello Fixkar Support, I need assistance with',
  isWhatsappActive: true,
};

export const useSupportSettings = () => {
  const [settings, setSettings] = useState<SupportSettings>(DEFAULT_SUPPORT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docRef = doc(db, 'app_settings', 'support');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            callingNumber: data.callingNumber ?? '',
            callingHours: data.callingHours ?? '10 AM - 7 PM',
            callingTitle: data.callingTitle ?? 'Call Helpline',
            isCallingActive: data.isCallingActive ?? true,
            whatsappNumber: data.whatsappNumber ?? '',
            whatsappSubtitle: data.whatsappSubtitle ?? 'Instant Reply',
            whatsappTitle: data.whatsappTitle ?? 'Chat on WhatsApp',
            whatsappDefaultMessage: data.whatsappDefaultMessage ?? 'Hello Fixkar Support, I need assistance with',
            isWhatsappActive: data.isWhatsappActive ?? true,
            updatedAt: data.updatedAt,
          });
        } else {
          setSettings(DEFAULT_SUPPORT_SETTINGS);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching support settings:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const saveSettings = useCallback(async (newSettings: Partial<SupportSettings>) => {
    setSaving(true);
    setError(null);
    try {
      await setDoc(
        docRef,
        {
          ...newSettings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSaving(false);
      return true;
    } catch (err: any) {
      console.error('Error saving support settings:', err);
      setError(err.message || 'Failed to save settings');
      setSaving(false);
      throw err;
    }
  }, []);

  return {
    settings,
    loading,
    saving,
    error,
    saveSettings,
  };
};
