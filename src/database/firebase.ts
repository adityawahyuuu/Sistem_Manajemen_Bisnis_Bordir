import * as admin from 'firebase-admin';
import { firebaseConfig } from '../config';
import { logger } from '../shared/utils/logger.util';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      clientEmail: firebaseConfig.clientEmail,
      privateKey: firebaseConfig.privateKey,
    }),
  });
}

export const db = admin.firestore();
export const auth = admin.auth();

export const testConnection = async (): Promise<boolean> => {
  try {
    await db.collection('_health').doc('check').set({ timestamp: new Date() });
    logger.info('Firebase connection successful');
    return true;
  } catch (error) {
    logger.error('Firebase connection failed', error);
    return false;
  }
};

export default admin;
