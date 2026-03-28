import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, handleFirestoreError, OperationType } from '../firebase';
import { Company } from '../types';

export function useCompanies(userId: string) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, `users/${userId}/companies`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCompanies(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Company)));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/companies`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { companies, loading };
}
