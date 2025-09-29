import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Karigar {
  id?: string;
  name: string;
  skill: string;
  experience: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt?: Date;
}

export const useKarigars = () => {
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const karigarsRef = collection(db, 'karigars');

  const fetchKarigars = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(karigarsRef);
      const karigarsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Karigar[];
      setKarigars(karigarsData);
    } catch (err) {
      setError('Failed to fetch karigars');
      console.error('Error fetching karigars:', err);
    } finally {
      setLoading(false);
    }
  };

  const addKarigar = async (karigar: Omit<Karigar, 'id'>) => {
    try {
      await addDoc(karigarsRef, karigar);
      await fetchKarigars();
      return { success: true };
    } catch (err) {
      console.error('Error adding karigar:', err);
      return { success: false, error: 'Failed to add karigar' };
    }
  };

  const updateKarigar = async (id: string, karigar: Partial<Karigar>) => {
    try {
      const karigarDoc = doc(db, 'karigars', id);
      await updateDoc(karigarDoc, karigar);
      await fetchKarigars();
      return { success: true };
    } catch (err) {
      console.error('Error updating karigar:', err);
      return { success: false, error: 'Failed to update karigar' };
    }
  };

  const deleteKarigar = async (id: string) => {
    try {
      const karigarDoc = doc(db, 'karigars', id);
      await deleteDoc(karigarDoc);
      await fetchKarigars();
      return { success: true };
    } catch (err) {
      console.error('Error deleting karigar:', err);
      return { success: false, error: 'Failed to delete karigar' };
    }
  };

  useEffect(() => {
    fetchKarigars();
  }, []);

  return {
    karigars,
    loading,
    error,
    addKarigar,
    updateKarigar,
    deleteKarigar,
    refreshKarigars: fetchKarigars
  };
};
