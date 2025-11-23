import { createInvoiceSchema, updateInvoiceSchema } from '../../src/modules/invoices/validators/invoice.validator';

describe('Invoice Validators', () => {
  describe('createInvoiceSchema', () => {
    describe('Positive scenarios', () => {
      it('should validate correct invoice data with items', () => {
        const validData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          invoice_date: '2024-01-15',
          due_date: '2024-02-15',
          tax_amount: 10000,
          discount_amount: 5000,
          notes: 'Test invoice',
          items: [
            {
              item_name: 'Bordir Logo',
              description: 'Logo embroidery',
              quantity: 100,
              unit_price: 5000,
            },
          ],
        };
        const { error } = createInvoiceSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate invoice with multiple items', () => {
        const validData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [
            { item_name: 'Item 1', quantity: 10, unit_price: 1000 },
            { item_name: 'Item 2', quantity: 20, unit_price: 2000 },
          ],
        };
        const { error } = createInvoiceSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe('Negative scenarios', () => {
      it('should reject missing customer_id', () => {
        const invalidData = {
          items: [{ item_name: 'Item', quantity: 1, unit_price: 1000 }],
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('customer_id');
      });

      it('should reject invalid UUID for customer_id', () => {
        const invalidData = {
          customer_id: 'not-a-uuid',
          items: [{ item_name: 'Item', quantity: 1, unit_price: 1000 }],
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('customer_id');
      });

      it('should reject empty items array', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [],
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('items');
      });

      it('should reject missing items', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('items');
      });

      it('should reject item without item_name', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [{ quantity: 1, unit_price: 1000 }],
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('item_name');
      });

      it('should reject negative quantity', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [{ item_name: 'Item', quantity: -1, unit_price: 1000 }],
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('quantity');
      });

      it('should reject zero quantity', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [{ item_name: 'Item', quantity: 0, unit_price: 1000 }],
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('quantity');
      });

      it('should reject negative unit_price', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [{ item_name: 'Item', quantity: 1, unit_price: -100 }],
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('unit_price');
      });

      it('should reject negative tax_amount', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          tax_amount: -1000,
          items: [{ item_name: 'Item', quantity: 1, unit_price: 1000 }],
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('tax_amount');
      });

      it('should reject invalid date format', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          invoice_date: 'not-a-date',
          items: [{ item_name: 'Item', quantity: 1, unit_price: 1000 }],
        };
        const { error } = createInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('invoice_date');
      });
    });
  });

  describe('updateInvoiceSchema', () => {
    describe('Positive scenarios', () => {
      it('should validate partial update with status', () => {
        const validData = { status: 'paid' };
        const { error } = updateInvoiceSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate all valid statuses', () => {
        const statuses = ['draft', 'generated', 'sent', 'paid', 'cancelled'];
        statuses.forEach((status) => {
          const { error } = updateInvoiceSchema.validate({ status });
          expect(error).toBeUndefined();
        });
      });
    });

    describe('Negative scenarios', () => {
      it('should reject invalid status', () => {
        const invalidData = { status: 'invalid-status' };
        const { error } = updateInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('status');
      });

      it('should reject negative tax_amount in update', () => {
        const invalidData = { tax_amount: -100 };
        const { error } = updateInvoiceSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });
  });
});
