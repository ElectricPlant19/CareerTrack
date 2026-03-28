import { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, handleFirestoreError, OperationType } from '../firebase';
import { Task } from '../types';

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, `users/${userId}/tasks`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/tasks`);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { tasks, loading };
}
