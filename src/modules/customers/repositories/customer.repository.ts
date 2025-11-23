import { db } from '../../../database/firebase';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../interfaces/customer.interface';

const customersCollection = db.collection('customers');

export const customerRepository = {
  async findAll(page = 1, limit = 10, search?: string): Promise<{ data: Customer[]; total: number }> {
    let query = customersCollection.orderBy('created_at', 'desc');

    // Get total count
    const allDocs = await customersCollection.get();
    let total = allDocs.size;

    // Apply search filter if provided (client-side filtering for Firestore)
    let results: Customer[] = [];
    if (search) {
      const searchLower = search.toLowerCase();
      const snapshot = await query.get();
      results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Customer))
        .filter(c =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.company_name?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower)
        );
      total = results.length;
      results = results.slice((page - 1) * limit, page * limit);
    } else {
      const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
      results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    }

    return { data: results, total };
  },

  async findById(id: string): Promise<Customer | null> {
    const doc = await customersCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Customer;
  },

  async create(data: CreateCustomerDto): Promise<Customer> {
    const docRef = customersCollection.doc();
    const customerData = {
      ...data,
      whatsapp_numbers: data.whatsapp_numbers || [],
      created_at: new Date(),
      updated_at: new Date(),
    };
    await docRef.set(customerData);
    return { id: docRef.id, ...customerData } as Customer;
  },

  async update(id: string, data: UpdateCustomerDto): Promise<Customer | null> {
    const docRef = customersCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const updateData = { ...data, updated_at: new Date() };
    await docRef.update(updateData);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Customer;
  },

  async delete(id: string): Promise<boolean> {
    const docRef = customersCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  },
};
