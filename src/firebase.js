import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore as _getFirestore } from 'firebase-admin/firestore';

let app;
export function getFirestore(env) {
  if (!app) {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    app = initializeApp({ credential: cert(serviceAccount) });
  }
  return _getFirestore(app);
}
