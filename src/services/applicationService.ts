import { db, collection, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Application, ApplicationStatus } from '../types';

type ApplicationInput = Omit<Application, 'id'>;

export async function createApplication(userId: string, data: ApplicationInput): Promise<void> {
  try {
    await addDoc(collection(db, `users/${userId}/applications`), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/applications`);
    throw error;
  }
}

export async function updateApplication(
  userId: string,
  id: string,
  data: Partial<ApplicationInput>
): Promise<void> {
  try {
    await updateDoc(doc(db, `users/${userId}/applications`, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/applications/${id}`);
    throw error;
  }
}

export async function updateApplicationStatus(
  userId: string,
  id: string,
  status: ApplicationStatus,
  currentApp: Application
): Promise<void> {
  try {
    await updateDoc(doc(db, `users/${userId}/applications`, id), {
      companyName: currentApp.companyName,
      position: currentApp.position,
      source: currentApp.source || '',
      status,
      applicationDate: currentApp.applicationDate,
      salary: currentApp.salary || '',
      benefits: currentApp.benefits || '',
      notes: currentApp.notes || '',
      tags: currentApp.tags || [],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/applications/${id}`);
    throw error;
  }
}

export async function deleteApplication(userId: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, `users/${userId}/applications`, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/applications/${id}`);
    throw error;
  }
}
