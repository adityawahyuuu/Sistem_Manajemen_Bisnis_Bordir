import { db } from '../../../database/firebase';
import { Waybill, WaybillItem, CreateWaybillDto } from '../interfaces/waybill.interface';

const waybillsCollection = db.collection('waybills');
const waybillItemsCollection = db.collection('waybill_items');

export const waybillRepository = {
  async findAll(page = 1, limit = 10, status?: string, customerId?: string): Promise<{ data: Waybill[]; total: number }> {
    let query: FirebaseFirestore.Query = waybillsCollection.orderBy('created_at', 'desc');

    if (status) query = query.where('status', '==', status);
    if (customerId) query = query.where('customer_id', '==', customerId);

    const allDocs = await query.get();
    const total = allDocs.size;
    const snapshot = await query.limit(limit).offset((page - 1) * limit).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Waybill));

    return { data, total };
  },

  async findById(id: string): Promise<Waybill | null> {
    const doc = await waybillsCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Waybill;
  },

  async findByIdWithItems(id: string): Promise<{ waybill: Waybill; items: WaybillItem[] } | null> {
    const waybillDoc = await waybillsCollection.doc(id).get();
    if (!waybillDoc.exists) return null;

    const itemsSnapshot = await waybillItemsCollection.where('waybill_id', '==', id).get();
    const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaybillItem));

    return { waybill: { id: waybillDoc.id, ...waybillDoc.data() } as Waybill, items };
  },

  async create(data: CreateWaybillDto, userId?: string): Promise<Waybill> {
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const countSnapshot = await waybillsCollection
      .where('waybill_number', '>=', `SJ-${datePrefix}`)
      .where('waybill_number', '<', `SJ-${datePrefix}~`)
      .get();
    const count = countSnapshot.size + 1;
    const waybillNumber = `SJ-${datePrefix}-${count.toString().padStart(4, '0')}`;

    const waybillRef = waybillsCollection.doc();
    const waybillData = {
      invoice_id: data.invoice_id || null,
      customer_id: data.customer_id,
      waybill_number: waybillNumber,
      waybill_date: data.waybill_date ? new Date(data.waybill_date) : new Date(),
      destination_address: data.destination_address || null,
      destination_city: data.destination_city || null,
      destination_province: data.destination_province || null,
      vehicle_number: data.vehicle_number || null,
      driver_name: data.driver_name || null,
      notes: data.notes || null,
      status: 'draft',
      generated_file_path: null,
      created_by: userId || null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await waybillRef.set(waybillData);

    if (data.items) {
      for (const item of data.items) {
        const itemRef = waybillItemsCollection.doc();
        await itemRef.set({
          waybill_id: waybillRef.id,
          item_name: item.name,
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          notes: item.notes || null,
          created_at: new Date(),
        });
      }
    }

    return { id: waybillRef.id, ...waybillData } as Waybill;
  },

  async update(id: string, data: Partial<Waybill>): Promise<Waybill | null> {
    const docRef = waybillsCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    await docRef.update({ ...data, updated_at: new Date() });
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as Waybill;
  },

  async delete(id: string): Promise<boolean> {
    const docRef = waybillsCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    const itemsSnapshot = await waybillItemsCollection.where('waybill_id', '==', id).get();
    const batch = db.batch();
    itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(docRef);
    await batch.commit();
    return true;
  },

  async updateFilePath(id: string, filePath: string): Promise<void> {
    await waybillsCollection.doc(id).update({
      generated_file_path: filePath,
      status: 'generated',
      updated_at: new Date(),
    });
  },
};
