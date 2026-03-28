import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import type { Document, DocumentType, DocumentCategory } from './types';

const app = initializeApp(firebaseConfig);
// Use the named Firestore database
export const db = getFirestore(app, 'careertrack-db');
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

type DocumentUploadInput = {
  id: string;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  tags: string[];
  notes?: string;
  applicationId?: string;
};

// Document management functions
export async function uploadDocument(file: File, userId: string, documentData: DocumentUploadInput) {
  try {
    const storagePath = `users/${userId}/documents/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const fileUrl = await getDownloadURL(storageRef);

    const docRef = doc(db, 'users', userId, 'documents', documentData.id);

    const filteredData: Omit<Document, never> = {
      id: documentData.id,
      name: documentData.name,
      type: documentData.type,
      category: documentData.category,
      tags: documentData.tags || [],
      notes: documentData.notes || undefined,
      fileUrl,
      storagePath,
      fileSize: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(documentData.applicationId ? { applicationId: documentData.applicationId } : {}),
    };

    await setDoc(docRef, filteredData);

    return { id: documentData.id, fileUrl, storagePath };
  } catch (error) {
    throw handleFirestoreError(error, OperationType.CREATE, `users/${userId}/documents`);
  }
}

export async function deleteDocument(documentId: string, userId: string, storagePath: string) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'documents', documentId));
    await deleteObject(ref(storage, storagePath));
  } catch (error) {
    throw handleFirestoreError(error, OperationType.DELETE, `users/${userId}/documents/${documentId}`);
  }
}

type DocumentUpdateInput = Partial<Pick<Document, 'name' | 'type' | 'category' | 'tags' | 'notes' | 'applicationId' | 'fileUrl' | 'storagePath' | 'fileSize' | 'mimeType'>>;

export async function updateDocument(documentId: string, userId: string, updates: DocumentUpdateInput) {
  try {
    await updateDoc(doc(db, 'users', userId, 'documents', documentId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/documents/${documentId}`);
  }
}

export function listenToDocuments(userId: string, callback: (documents: Document[]) => void) {
  const q = query(collection(db, 'users', userId, 'documents'));
  return onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Document));
    callback(documents);
  });
}
