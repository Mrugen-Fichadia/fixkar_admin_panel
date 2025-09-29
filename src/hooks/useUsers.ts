import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface User {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'Customer' | 'Worker' | 'Admin';
  isActive?: boolean;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  aadharCard?: string;
  panCard?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  beneficiaryName?: string;
  selectedServices?: string[];
  subServices?: {
    [key: string]: {
      is_all: boolean;
      selectedSubServices: string[];
    };
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
  timestamp?: string;
  notificationEnabled?: boolean;
  fcmToken?: string;
  isBankDetailsVerified?: boolean;
  selfieImageUrl?: string;
  frontIdImageUrl?: string;
  backIdImageUrl?: string;
  range?: number;
  area?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const usersRef = collection(db, 'users');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(usersRef);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const newUser = {
        ...user,
        createdAt: new Date()
      };
      await addDoc(usersRef, newUser);
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error adding user:', err);
      return { success: false, error: 'Failed to add user' };
    }
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    try {
      const userDoc = doc(db, 'users', id);
      await updateDoc(userDoc, user);
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error updating user:', err);
      return { success: false, error: 'Failed to update user' };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const userDoc = doc(db, 'users', id);
      await deleteDoc(userDoc);
      await fetchUsers();
      return { success: true };
    } catch (err) {
      console.error('Error deleting user:', err);
      return { success: false, error: 'Failed to delete user' };
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers
  };
};
