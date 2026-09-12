import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface MaterialItem {
  name: string;
  quantity?: string | number;
  [key: string]: any;
}

export interface MaterialSuggestion {
  message?: string;
  name?: string;
  quantity?: string | number;
  fromCustomer?: boolean;
  time?: string;
  timestamp?: any;
  [key: string]: any;
}

export interface JobRequest {
  id: string;
  customerUid: string;
  jobTitle?: string;
  jobDescription?: string;
  serviceName?: string;
  subServices?: string[];
  isSelectAll?: boolean;
  status: 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled' | string;
  customerSideJobStatus?: string;
  
  // Worker info
  acceptedWorkerId?: string;
  favouriteWorkerID?: string;
  isFavouriteWorker?: boolean;
  acceptedAt?: Timestamp | Date | string | null;

  // Location
  location?: string;
  area?: string;
  latitude?: number;
  longitude?: number;

  // Financials & Payments
  budget?: number | string;
  suggestedAmount?: number | string;
  amountWithMaterial?: number | string;
  totalMaterialAmount?: number | string;
  ownerCommission?: number | string;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded' | string;
  paymentMode?: 'cash' | 'online' | string;
  paymentAmount?: number | string;
  paymentId?: string;
  orderId?: string;
  paymentInitiated?: boolean;
  paymentInitiatedAt?: Timestamp | Date | string | null;
  paymentCompletedAt?: Timestamp | Date | string | null;
  paymentReleasedAt?: Timestamp | Date | string | null;
  paymentTimestamp?: Timestamp | Date | string | null;

  // Materials
  materialResponsibility?: 'customer' | 'worker' | 'none' | string;
  materials?: MaterialItem[];
  materialSuggestions?: MaterialSuggestion[];
  suggestedMaterials?: any[];

  // Media
  imageUrls?: string[];
  videoUrls?: string[];
  audioUrl?: string | null;

  // Timestamps
  createdAt?: Timestamp | Date | string | null;
  updatedAt?: Timestamp | Date | string | null;
  jobCompletedAt?: Timestamp | Date | string | null;
  cancelledAt?: Timestamp | Date | string | null;
  cancellationReason?: string;

  // Ratings
  customerRating?: number | string;
  ratedAt?: Timestamp | Date | string | null;
  customerRatedAt?: Timestamp | Date | string | null;
  workerRatingToCustomer?: number | string;
}

export interface UserSummary {
  name: string;
  phone?: string;
  email?: string;
  role?: string;
}

export const useJobs = () => {
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserSummary>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users lookup map to easily display customer and worker names
  const fetchUsersMap = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      const mapping: Record<string, UserSummary> = {};
      snap.forEach((doc) => {
        const data = doc.data();
        mapping[doc.id] = {
          name: data.name || 'Unnamed',
          phone: data.phone || data.phoneNumber || '',
          email: data.email || '',
          role: data.role || '',
        };
        if (data.uid && data.uid !== doc.id) {
          mapping[data.uid] = mapping[doc.id];
        }
      });
      setUserMap(mapping);
    } catch (err) {
      console.warn('Could not load user lookup map:', err);
    }
  };

  useEffect(() => {
    fetchUsersMap();

    setLoading(true);
    const jobsRef = collection(db, 'job_requests');
    // Order by createdAt desc; fallback gracefully if index is missing
    const q = query(jobsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsData: JobRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<JobRequest, 'id'>),
        }));
        setJobs(jobsData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Primary ordered query failed, trying unconstrained query:', err);
        // Fallback without orderBy in case of indexing issues
        const unconstrainedUnsub = onSnapshot(
          jobsRef,
          (snapshot) => {
            const jobsData: JobRequest[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as Omit<JobRequest, 'id'>),
            }));
            // Sort in memory by createdAt if available
            jobsData.sort((a, b) => {
              const getTime = (val: any) => {
                if (!val) return 0;
                if (val.toMillis) return val.toMillis();
                if (val.seconds) return val.seconds * 1000;
                return new Date(val).getTime() || 0;
              };
              return getTime(b.createdAt) - getTime(a.createdAt);
            });
            setJobs(jobsData);
            setLoading(false);
            setError(null);
          },
          (fallbackErr) => {
            console.error('Error fetching jobs:', fallbackErr);
            setError('Failed to fetch job requests');
            setLoading(false);
          }
        );
        return () => unconstrainedUnsub();
      }
    );

    return () => unsubscribe();
  }, []);

  const refreshUsers = () => {
    fetchUsersMap();
  };

  return {
    jobs,
    userMap,
    loading,
    error,
    refreshUsers,
  };
};
