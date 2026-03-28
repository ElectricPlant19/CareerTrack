import { db, collection, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Contact } from '../types';

type ContactInput = Omit<Contact, 'id'>;

export async function createContact(userId: string, data: ContactInput): Promise<void> {
  try {
    await addDoc(collection(db, `users/${userId}/contacts`), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/contacts`);
    throw error;
  }
}

export async function updateContact(userId: string, id: string, data: Partial<ContactInput>): Promise<void> {
  try {
    await updateDoc(doc(db, `users/${userId}/contacts`, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/contacts/${id}`);
    throw error;
  }
}

export async function deleteContact(userId: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, `users/${userId}/contacts`, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/contacts/${id}`);
    throw error;
  }
}
