import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, handleFirestoreError, OperationType } from '../firebase';
import { Application } from '../types';

export function useApplications(userId: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, `users/${userId}/applications`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setApplications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/applications`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { applications, loading };
}
