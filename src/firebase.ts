import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

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

// Document management functions
export async function uploadDocument(file: File, userId: string, documentData: any) {
  try {
    console.log('Uploading document for user:', userId);
    console.log('Document data:', documentData);
    
    const storagePath = `users/${userId}/documents/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const fileUrl = await getDownloadURL(storageRef);
    console.log('File uploaded to storage:', fileUrl);
    
    const docRef = doc(db, 'users', userId, 'documents', documentData.id);
    
    // Filter out undefined values
    let filteredData: any = {
      id: documentData.id,
      name: documentData.name,
      type: documentData.type,
      category: documentData.category,
      tags: documentData.tags || [],
      notes: documentData.notes || null,
      fileUrl,
      storagePath,
      fileSize: file.size,
      mimeType: file.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Only include applicationId if it exists
    if (documentData.applicationId) {
      filteredData.applicationId = documentData.applicationId;
    }
    
    console.log('Saving document to Firestore:', filteredData);
    
    await setDoc(docRef, filteredData);
    console.log('Document saved successfully');
    
    return { id: documentData.id, fileUrl, storagePath };
  } catch (error) {
    console.error('Upload error:', error);
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

export async function updateDocument(documentId: string, userId: string, updates: any) {
  try {
    await updateDoc(doc(db, 'users', userId, 'documents', documentId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    throw handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/documents/${documentId}`);
  }
}

export function listenToDocuments(userId: string, callback: (documents: any[]) => void) {
  const q = query(collection(db, 'users', userId, 'documents'));
  return onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(documents);
  });
}
