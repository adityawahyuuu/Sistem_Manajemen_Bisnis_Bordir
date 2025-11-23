import { customerRepository } from '../repositories/customer.repository';
import { CreateCustomerDto, UpdateCustomerDto } from '../interfaces/customer.interface';
import { AppError } from '../../../middleware';

export const customerService = {
  async findAll(page = 1, limit = 10, search?: string) {
    return customerRepository.findAll(page, limit, search);
  },

  async findById(id: string) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    return customer;
  },

  async create(data: CreateCustomerDto) {
    return customerRepository.create(data);
  },

  async update(id: string, data: UpdateCustomerDto) {
    const customer = await customerRepository.update(id, data);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    return customer;
  },

  async delete(id: string) {
    const deleted = await customerRepository.delete(id);
    if (!deleted) {
      throw new AppError('Customer not found', 404);
    }
    return true;
  },
};
