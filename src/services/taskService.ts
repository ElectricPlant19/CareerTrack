import { db, collection, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Task } from '../types';

type TaskInput = Omit<Task, 'id'>;

export async function createTask(userId: string, data: TaskInput): Promise<void> {
  try {
    await addDoc(collection(db, `users/${userId}/tasks`), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/tasks`);
    throw error;
  }
}

export async function updateTask(userId: string, id: string, data: Partial<TaskInput>): Promise<void> {
  try {
    await updateDoc(doc(db, `users/${userId}/tasks`, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/tasks/${id}`);
    throw error;
  }
}

export async function deleteTask(userId: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, `users/${userId}/tasks`, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/tasks/${id}`);
    throw error;
  }
}
