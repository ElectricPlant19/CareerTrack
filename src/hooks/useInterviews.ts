import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, handleFirestoreError, OperationType } from '../firebase';
import { Interview } from '../types';

export function useInterviews(userId: string) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, `users/${userId}/interviews`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setInterviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Interview)));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/interviews`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { interviews, loading };
}
