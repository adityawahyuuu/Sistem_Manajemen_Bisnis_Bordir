import { db } from '../../../database/firebase';
import { Receipt, CreateReceiptDto } from '../interfaces/receipt.interface';

const receiptsCollection = db.collection('receipts');

export const receiptRepository = {
  async findAll(page = 1, limit = 10, customerId?: string): Promise<{ data: Receipt[]; total: number }> {
    let query: FirebaseFirestore.Query = receiptsCollection.orderBy('created_at', 'desc');

    if (customerId) query = query.where('customer_id', '==', customerId);

    const allDocs = await query.get();
    const total = allDocs.size;
    const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Receipt));

    return { data, total };
  },

  async findById(id: string): Promise<Receipt | null> {
    const doc = await receiptsCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Receipt;
  },

  async create(data: CreateReceiptDto, userId?: string): Promise<Receipt> {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const countSnapshot = await receiptsCollection
      .where('receipt_number', '>=', `KW-${datePrefix}`)
      .where('receipt_number', '<', `KW-${datePrefix}~`)
      .get();
    const count = countSnapshot.size + 1;
    const receiptNumber = `KW-${datePrefix}-${count.toString().padStart(4, '0')}`;

    const receiptRef = receiptsCollection.doc();
    const receiptData = {
      invoice_id: data.invoice_id || null,
      customer_id: data.customer_id,
      receipt_number: receiptNumber,
      receipt_date: data.receipt_date ? new Date(data.receipt_date) : new Date(),
      amount: data.amount,
      payment_method: data.payment_method || 'cash',
      description: data.description || null,
      received_by: data.received_by || null,
      notes: data.notes || null,
      generated_file_path: null,
      created_by: userId || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await receiptRef.set(receiptData);

    return { id: receiptRef.id, ...receiptData } as Receipt;
  },

  async update(id: string, data: Partial<Receipt>): Promise<Receipt | null> {
    const docRef = receiptsCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    await docRef.update({ ...data, updated_at: new Date() });
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Receipt;
  },

  async delete(id: string): Promise<boolean> {
    const docRef = receiptsCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  },

  async updateFilePath(id: string, filePath: string): Promise<void> {
    await receiptsCollection.doc(id).update({
      generated_file_path: filePath,
      status: 'generated',
      updated_at: new Date(),
    });
  },
};
