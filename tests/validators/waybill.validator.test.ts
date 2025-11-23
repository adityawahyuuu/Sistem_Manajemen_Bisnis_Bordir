import { createWaybillSchema, updateWaybillSchema } from '../../src/modules/waybills/validators/waybill.validator';

describe('Waybill Validators', () => {
  describe('createWaybillSchema', () => {
    describe('Positive scenarios', () => {
      it('should validate correct waybill data', () => {
        const validData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          invoice_id: '550e8400-e29b-41d4-a716-446655440001',
          waybill_date: '2024-01-15',
          destination_address: '123 Main St',
          destination_city: 'Jakarta',
          destination_province: 'DKI Jakarta',
          vehicle_number: 'B 1234 ABC',
          driver_name: 'John Driver',
          notes: 'Handle with care',
          items: [
            {
              item_name: 'Bordir Package',
              quantity: 100,
              unit: 'pcs',
              notes: 'Fragile',
            },
          ],
        };
        const { error } = createWaybillSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate waybill without optional fields', () => {
        const validData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [{ item_name: 'Item', quantity: 10 }],
        };
        const { error } = createWaybillSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe('Negative scenarios', () => {
      it('should reject missing customer_id', () => {
        const invalidData = {
          items: [{ item_name: 'Item', quantity: 10 }],
        };
        const { error } = createWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('customer_id');
      });

      it('should reject invalid UUID for customer_id', () => {
        const invalidData = {
          customer_id: 'invalid-uuid',
          items: [{ item_name: 'Item', quantity: 10 }],
        };
        const { error } = createWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should reject missing items', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
        };
        const { error } = createWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('items');
      });

      it('should reject empty items array', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [],
        };
        const { error } = createWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should reject item without item_name', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [{ quantity: 10 }],
        };
        const { error } = createWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('item_name');
      });

      it('should reject zero quantity', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [{ item_name: 'Item', quantity: 0 }],
        };
        const { error } = createWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should reject negative quantity', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          items: [{ item_name: 'Item', quantity: -5 }],
        };
        const { error } = createWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
      });

      it('should reject destination_city exceeding max length', () => {
        const invalidData = {
          customer_id: '550e8400-e29b-41d4-a716-446655440000',
          destination_city: 'A'.repeat(101),
          items: [{ item_name: 'Item', quantity: 10 }],
        };
        const { error } = createWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('destination_city');
      });
    });
  });

  describe('updateWaybillSchema', () => {
    describe('Positive scenarios', () => {
      it('should validate partial update', () => {
        const validData = { driver_name: 'New Driver' };
        const { error } = updateWaybillSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate all valid statuses', () => {
        const statuses = ['draft', 'generated', 'sent', 'delivered', 'cancelled'];
        statuses.forEach((status) => {
          const { error } = updateWaybillSchema.validate({ status });
          expect(error).toBeUndefined();
        });
      });
    });

    describe('Negative scenarios', () => {
      it('should reject invalid status', () => {
        const invalidData = { status: 'invalid' };
        const { error } = updateWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('status');
      });

      it('should reject driver_name exceeding max length', () => {
        const invalidData = { driver_name: 'A'.repeat(256) };
        const { error } = updateWaybillSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });
  });
});
