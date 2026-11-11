import { initializeApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use initializeFirestore with ignoreUndefinedProperties to guarantee seamless sync without undefined errors
export const db = initializeFirestore(
  app,
  { ignoreUndefinedProperties: true },
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Operating with local cache.');
    }
    return false;
  }
}

testConnection().catch(() => {
  // Graceful boot
});
