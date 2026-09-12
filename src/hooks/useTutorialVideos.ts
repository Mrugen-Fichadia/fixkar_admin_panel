import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';

export type VideoCategory = 'Worker' | 'Customer' | 'Both';

export interface TutorialVideo {
  id: string;
  title: string;
  description?: string;
  category: VideoCategory;
  videoUrl: string;
  thumbnailUrl: string;
  order: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export const useTutorialVideos = () => {
  const [videos, setVideos] = useState<TutorialVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videosRef = collection(db, 'tutorial_videos');

  useEffect(() => {
    setLoading(true);
    // Real-time listener for tutorial videos
    const q = query(videosRef, orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedVideos: TutorialVideo[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            category: (data.category as VideoCategory) || 'Both',
            videoUrl: data.videoUrl || '',
            thumbnailUrl: data.thumbnailUrl || '',
            order: typeof data.order === 'number' ? data.order : 0,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        });
        setVideos(fetchedVideos);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching tutorial videos:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Upload file (video or thumbnail image) to Firebase Storage
  const uploadFile = useCallback(
    (file: File, folder: 'videos' | 'thumbnails', onProgress?: (percent: number) => void): Promise<string> => {
      return new Promise((resolve, reject) => {
        const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storageRef = ref(storage, `tutorial_help/${folder}/${uniqueFileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) {
              onProgress(Math.round(progress));
            }
          },
          (error) => {
            console.error('Upload failed:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (err) {
              reject(err);
            }
          }
        );
      });
    },
    []
  );

  const addVideo = useCallback(
    async (data: Omit<TutorialVideo, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const docRef = await addDoc(videosRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return docRef.id;
      } catch (err: any) {
        console.error('Error adding tutorial video:', err);
        throw err;
      }
    },
    [videosRef]
  );

  const updateVideo = useCallback(async (id: string, data: Partial<Omit<TutorialVideo, 'id'>>) => {
    try {
      const docRef = doc(db, 'tutorial_videos', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Error updating tutorial video:', err);
      throw err;
    }
  }, []);

  const deleteVideo = useCallback(async (id: string) => {
    try {
      const docRef = doc(db, 'tutorial_videos', id);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.error('Error deleting tutorial video:', err);
      throw err;
    }
  }, []);

  const toggleVideoStatus = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, 'tutorial_videos', id);
      await updateDoc(docRef, {
        isActive: !currentStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Error toggling tutorial video status:', err);
      throw err;
    }
  }, []);

  return {
    videos,
    loading,
    error,
    uploadFile,
    addVideo,
    updateVideo,
    deleteVideo,
    toggleVideoStatus,
  };
};
