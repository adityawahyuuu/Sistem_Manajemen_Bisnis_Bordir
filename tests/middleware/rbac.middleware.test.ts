import { Request, Response, NextFunction } from 'express';
import { requireRole } from '../../src/middleware/rbac.middleware';
import { ROLES } from '../../src/shared/constants/roles.constant';

describe('RBAC Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = { status: statusMock };
    nextFunction = jest.fn();
  });

  describe('Positive scenarios', () => {
    it('should allow admin to access admin-only routes', () => {
      mockRequest.user = {
        id: '123',
        email: 'admin@example.com',
        role: ROLES.ADMIN,
      };

      const middleware = requireRole(ROLES.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should allow user to access user routes', () => {
      mockRequest.user = {
        id: '123',
        email: 'user@example.com',
        role: ROLES.USER,
      };

      const middleware = requireRole(ROLES.USER);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple allowed roles', () => {
      mockRequest.user = {
        id: '123',
        email: 'admin@example.com',
        role: ROLES.ADMIN,
      };

      const middleware = requireRole(ROLES.ADMIN, ROLES.USER);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Negative scenarios', () => {
    it('should deny access when user is not set', () => {
      mockRequest.user = undefined;

      const middleware = requireRole(ROLES.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny user access to admin-only routes', () => {
      mockRequest.user = {
        id: '123',
        email: 'user@example.com',
        role: ROLES.USER,
      };

      const middleware = requireRole(ROLES.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
