import { db } from '../../../database/firebase';
import { User } from '../interfaces/auth.interface';

const usersCollection = db.collection('users');

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const doc = await usersCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as User;
  },

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await usersCollection.where('email', '==', email).where('is_active', '==', true).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  },

  async create(id: string, data: Partial<User>): Promise<User> {
    const userData = {
      ...data,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await usersCollection.doc(id).set(userData);
    return { id, ...userData } as User;
  },

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const docRef = usersCollection.doc(id);
    await docRef.update({ ...data, updated_at: new Date() });
    const doc = await docRef.get();
    return { id: doc.id, ...doc.data() } as User;
  },

  async findAll(): Promise<User[]> {
    const snapshot = await usersCollection.orderBy('created_at', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },
};
