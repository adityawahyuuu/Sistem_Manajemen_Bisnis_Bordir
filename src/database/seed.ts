import { db, auth } from './firebase';
import { logger } from '../shared/utils/logger.util';

async function runSeeds() {
  logger.info('Starting database seeding...');

  try {
    // Create admin user in Firebase Auth
    let adminUser;
    try {
      adminUser = await auth.getUserByEmail('admin@bordir.com');
      logger.info('Admin user already exists');
    } catch {
      adminUser = await auth.createUser({
        email: 'admin@bordir.com',
        password: 'admin123',
        displayName: 'Administrator',
      });
      logger.info('Admin user created in Firebase Auth');
    }

    // Set custom claims for admin role
    await auth.setCustomUserClaims(adminUser.uid, { role: 'admin' });

    // Create admin user document in Firestore
    await db.collection('users').doc(adminUser.uid).set({
      email: 'admin@bordir.com',
      full_name: 'Administrator',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }, { merge: true });

    logger.info('Admin user document created (email: admin@bordir.com, password: admin123)');

    // Create sample customer
    const customerRef = db.collection('customers').doc();
    await customerRef.set({
      name: 'John Doe',
      company_name: 'PT Bordir Jaya',
      email: 'john@bordir.com',
      phone: '081234567890',
      whatsapp_numbers: ['628123456789'],
      address: 'Jl. Merdeka No. 123',
      city: 'Tasikmalaya',
      province: 'Jawa Barat',
      postal_code: '46115',
      created_at: new Date(),
      updated_at: new Date(),
    });

    logger.info('Sample customer created');
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

runSeeds();
