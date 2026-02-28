import { prisma } from '../../../config/prisma';
import { AppError } from '../../../middleware/error.middleware';

export const itemService = {
  async getAllItems(companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return await prisma.items.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  },

  async getItemById(itemId: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const item = await prisma.items.findFirst({
      where: { id: itemId, company_id: companyId },
    });

    if (!item) {
      throw new AppError('Item not found', 404);
    }

    return item;
  },

  async createItem(companyId: number, userId: number, data: {
    item_name: string;
    description?: string;
    category?: string;
    unit?: string;
    unit_price?: number;
  }) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return await prisma.items.create({
      data: {
        company_id: companyId,
        item_name: data.item_name,
        description: data.description,
        category: data.category,
        unit: data.unit || 'pcs',
        unit_price: data.unit_price || 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  async updateItem(itemId: number, companyId: number, userId: number, data: {
    item_name?: string;
    description?: string;
    category?: string;
    unit?: string;
    unit_price?: number;
  }) {
    await this.getItemById(itemId, companyId, userId);

    return await prisma.items.update({
      where: { id: itemId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  },

  async deleteItem(itemId: number, companyId: number, userId: number) {
    await this.getItemById(itemId, companyId, userId);

    return await prisma.items.delete({
      where: { id: itemId },
    });
  },

  // Customer-specific items
  async getCustomerItems(customerId: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const customer = await prisma.customers.findFirst({
      where: { id: customerId, company_id: companyId },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return await prisma.customer_items.findMany({
      where: { customer_id: customerId },
      include: {
        items: true,
      },
    });
  },

  async addItemToCustomer(customerId: number, companyId: number, userId: number, data: {
    item_id: number;
    custom_price?: number;
    notes?: string;
  }) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const customer = await prisma.customers.findFirst({
      where: { id: customerId, company_id: companyId },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const item = await prisma.items.findFirst({
      where: { id: data.item_id, company_id: companyId },
    });

    if (!item) {
      throw new AppError('Item not found', 404);
    }

    const existing = await prisma.customer_items.findFirst({
      where: { customer_id: customerId, item_id: data.item_id },
    });

    if (existing) {
      throw new AppError('Item already added to customer', 400);
    }

    return await prisma.customer_items.create({
      data: {
        customer_id: customerId,
        item_id: data.item_id,
        custom_price: data.custom_price,
        notes: data.notes,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        items: true,
      },
    });
  },

  async removeItemFromCustomer(customerItemId: number, customerId: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const customerItem = await prisma.customer_items.findFirst({
      where: { id: customerItemId, customer_id: customerId },
    });

    if (!customerItem) {
      throw new AppError('Customer item not found', 404);
    }

    return await prisma.customer_items.delete({
      where: { id: customerItemId },
    });
  },
};
