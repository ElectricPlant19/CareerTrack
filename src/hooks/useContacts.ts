import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, handleFirestoreError, OperationType } from '../firebase';
import { Contact } from '../types';

export function useContacts(userId: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, `users/${userId}/contacts`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setContacts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contact)));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/contacts`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { contacts, loading };
}
