import { prisma } from '../../../config/prisma';
import { AppError } from '../../../middleware/error.middleware';

export const cashAccountService = {
  async getAllAccounts(companyId: number, userId: number) {
    // Verify ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return await prisma.company_cash_accounts.findMany({
      where: { company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
  },

  async getAccountById(accountId: number, companyId: number, userId: number) {
    // Verify ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const account = await prisma.company_cash_accounts.findFirst({
      where: { id: accountId, company_id: companyId },
    });

    if (!account) {
      throw new AppError('Cash account not found', 404);
    }

    return account;
  },

  async createAccount(companyId: number, userId: number, data: {
    account_name: string;
    account_number?: string;
    bank_name?: string;
    initial_balance?: number;
    description?: string;
  }) {
    // Verify ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const initialBalance = data.initial_balance || 0;

    return await prisma.company_cash_accounts.create({
      data: {
        company_id: companyId,
        account_name: data.account_name,
        account_number: data.account_number,
        bank_name: data.bank_name,
        initial_balance: initialBalance,
        current_balance: initialBalance,
        description: data.description,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  async updateAccount(
    accountId: number,
    companyId: number,
    userId: number,
    data: {
      account_name?: string;
      account_number?: string;
      bank_name?: string;
      description?: string;
      is_active?: boolean;
    }
  ) {
    // Verify ownership
    await this.getAccountById(accountId, companyId, userId);

    return await prisma.company_cash_accounts.update({
      where: { id: accountId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  },

  async deleteAccount(accountId: number, companyId: number, userId: number) {
    // Verify ownership
    await this.getAccountById(accountId, companyId, userId);

    return await prisma.company_cash_accounts.delete({
      where: { id: accountId },
    });
  },
};
