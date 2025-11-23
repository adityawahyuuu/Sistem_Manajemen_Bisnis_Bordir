import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate } from '../../src/middleware/validation.middleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockRequest = { body: {} };
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = { status: statusMock };
    nextFunction = jest.fn();
  });

  const testSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
  });

  describe('Positive scenarios', () => {
    it('should call next() when validation passes', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should strip unknown fields from body', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        unknownField: 'should be stripped',
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body.unknownField).toBeUndefined();
    });
  });

  describe('Negative scenarios', () => {
    it('should return 400 when required field is missing', () => {
      mockRequest.body = {
        name: 'John Doe',
        // missing email
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 when email format is invalid', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'not-an-email',
      };

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 when body is empty', () => {
      mockRequest.body = {};

      const middleware = validate(testSchema);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
