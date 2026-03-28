import { db, collection, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Company } from '../types';

type CompanyInput = Omit<Company, 'id'>;

export async function createCompany(userId: string, data: CompanyInput): Promise<void> {
  try {
    await addDoc(collection(db, `users/${userId}/companies`), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/companies`);
    throw error;
  }
}

export async function updateCompany(userId: string, id: string, data: Partial<CompanyInput>): Promise<void> {
  try {
    await updateDoc(doc(db, `users/${userId}/companies`, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/companies/${id}`);
    throw error;
  }
}

export async function deleteCompany(userId: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, `users/${userId}/companies`, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/companies/${id}`);
    throw error;
  }
}
