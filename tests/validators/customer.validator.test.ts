import { createCustomerSchema, updateCustomerSchema } from '../../src/modules/customers/validators/customer.validator';

describe('Customer Validators', () => {
  describe('createCustomerSchema', () => {
    describe('Positive scenarios', () => {
      it('should validate correct customer data', () => {
        const validData = {
          name: 'John Doe',
          phone: '081234567890',
          email: 'john@example.com',
          address: '123 Main St',
        };
        const { error } = createCustomerSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate customer without optional email', () => {
        const validData = {
          name: 'John Doe',
          phone: '081234567890',
          address: '123 Main St',
        };
        const { error } = createCustomerSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe('Negative scenarios', () => {
      it('should reject empty name', () => {
        const invalidData = {
          name: '',
          phone: '081234567890',
          address: '123 Main St',
        };
        const { error } = createCustomerSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('name');
      });

      it('should reject missing name', () => {
        const invalidData = {
          phone: '081234567890',
          address: '123 Main St',
        };
        const { error } = createCustomerSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('name');
      });

      it('should reject invalid email format', () => {
        const invalidData = {
          name: 'John Doe',
          phone: '081234567890',
          email: 'invalid-email',
          address: '123 Main St',
        };
        const { error } = createCustomerSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('email');
      });

      it('should reject name shorter than 2 characters', () => {
        const invalidData = {
          name: 'J',
        };
        const { error } = createCustomerSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('name');
      });

      it('should reject name exceeding max length', () => {
        const invalidData = {
          name: 'A'.repeat(256),
        };
        const { error } = createCustomerSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('name');
      });
    });
  });

  describe('updateCustomerSchema', () => {
    describe('Positive scenarios', () => {
      it('should validate partial update with only name', () => {
        const validData = { name: 'Jane Doe' };
        const { error } = updateCustomerSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate partial update with only phone', () => {
        const validData = { phone: '089876543210' };
        const { error } = updateCustomerSchema.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should validate full update', () => {
        const validData = {
          name: 'Jane Doe',
          phone: '089876543210',
          email: 'jane@example.com',
          address: '456 Oak Ave',
        };
        const { error } = updateCustomerSchema.validate(validData);
        expect(error).toBeUndefined();
      });
    });

    describe('Negative scenarios', () => {
      it('should reject invalid email in update', () => {
        const invalidData = { email: 'not-an-email' };
        const { error } = updateCustomerSchema.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.message).toContain('email');
      });

      it('should reject empty string for name', () => {
        const invalidData = { name: '' };
        const { error } = updateCustomerSchema.validate(invalidData);
        expect(error).toBeDefined();
      });
    });
  });
});
