import { db } from '../../../database/firebase';
import { Invoice, InvoiceItem, CreateInvoiceDto, CreateInvoiceItemDto } from '../interfaces/invoice.interface';

const invoicesCollection = db.collection('invoices');
const invoiceItemsCollection = db.collection('invoice_items');

export const invoiceRepository = {
  async findAll(page = 1, limit = 10, status?: string, customerId?: string): Promise<{ data: Invoice[]; total: number }> {
    let query: FirebaseFirestore.Query = invoicesCollection.orderBy('created_at', 'desc');

    if (status) {
      query = query.where('status', '==', status);
    }
    if (customerId) {
      query = query.where('customer_id', '==', customerId);
    }

    const allDocs = await query.get();
    const total = allDocs.size;

    const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));

    return { data, total };
  },

  async findById(id: string): Promise<Invoice | null> {
    const doc = await invoicesCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Invoice;
  },

  async findByIdWithItems(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | null> {
    const invoiceDoc = await invoicesCollection.doc(id).get();
    if (!invoiceDoc.exists) return null;

    const itemsSnapshot = await invoiceItemsCollection.where('invoice_id', '==', id).get();
    const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvoiceItem));

    return {
      invoice: { id: invoiceDoc.id, ...invoiceDoc.data() } as Invoice,
      items,
    };
  },

  async create(data: CreateInvoiceDto, userId?: string): Promise<Invoice> {
    // Generate invoice number
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const countSnapshot = await invoicesCollection
      .where('invoice_number', '>=', `INV-${datePrefix}`)
      .where('invoice_number', '<', `INV-${datePrefix}~`)
      .get();
    const count = countSnapshot.size + 1;
    const invoiceNumber = `INV-${datePrefix}-${count.toString().padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const itemsWithTotals = data.items.map(item => {
      const totalPrice = item.quantity * item.unit_price;
      subtotal += totalPrice;
      return { ...item, total_price: totalPrice };
    });

    const taxAmount = data.tax_amount || 0;
    const discountAmount = data.discount_amount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Create invoice
    const invoiceRef = invoicesCollection.doc();
    const invoiceData = {
      customer_id: data.customer_id,
      invoice_number: invoiceNumber,
      invoice_date: data.invoice_date ? new Date(data.invoice_date) : new Date(),
      due_date: data.due_date ? new Date(data.due_date) : null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      status: 'draft',
      notes: data.notes || null,
      generated_file_path: null,
      created_by: userId || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await invoiceRef.set(invoiceData);

    // Create items
    for (const item of itemsWithTotals) {
      const itemRef = invoiceItemsCollection.doc();
      await itemRef.set({
        invoice_id: invoiceRef.id,
        item_name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
        unit_price: item.unit_price,
        total_price: item.total_price,
        created_at: new Date(),
      });
    }

    return { id: invoiceRef.id, ...invoiceData } as Invoice;
  },

  async update(id: string, data: Partial<Invoice>): Promise<Invoice | null> {
    const docRef = invoicesCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    const updateData = { ...data, updated_at: new Date() };
    await docRef.update(updateData);
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Invoice;
  },

  async delete(id: string): Promise<boolean> {
    const docRef = invoicesCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    // Delete items first
    const itemsSnapshot = await invoiceItemsCollection.where('invoice_id', '==', id).get();
    const batch = db.batch();
    itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(docRef);
    await batch.commit();
    return true;
  },

  async updateFilePath(id: string, filePath: string): Promise<void> {
    await invoicesCollection.doc(id).update({
      generated_file_path: filePath,
      status: 'generated',
      updated_at: new Date(),
    });
  },
};
