import { db, collection, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Interview } from '../types';

type InterviewInput = Omit<Interview, 'id'>;

export async function createInterview(userId: string, data: InterviewInput): Promise<void> {
  try {
    await addDoc(collection(db, `users/${userId}/interviews`), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/interviews`);
    throw error;
  }
}

export async function updateInterview(userId: string, id: string, data: Partial<InterviewInput>): Promise<void> {
  try {
    await updateDoc(doc(db, `users/${userId}/interviews`, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/interviews/${id}`);
    throw error;
  }
}

export async function deleteInterview(userId: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, `users/${userId}/interviews`, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/interviews/${id}`);
    throw error;
  }
}
