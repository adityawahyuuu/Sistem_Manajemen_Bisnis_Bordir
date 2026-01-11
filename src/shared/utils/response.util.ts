import { Response } from 'express';
import { timezoneUtil } from './timezone.util';

type ResponseType = 'success' | 'error' | 'fail';

interface ApiResponse<T> {
  type: ResponseType;
  message: string;
  data: T | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  auth?: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  };
}

export const sendAuthSuccess = <T>(
  res: Response,
  data: T,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  },
  message = 'Authentication successful',
  statusCode = 200
) => {
  const response: ApiResponse<T> = {
    type: 'success',
    message,
    data,
    auth: tokens,
  };

  return res.status(statusCode).json(response);
};

export const sendAuthSuccessWithDates = <T>(
  res: Response,
  data: T,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  },
  message = 'Authentication successful',
  statusCode = 200
) => {
  const convertedData = convertDatesToJakarta(data);

  return sendAuthSuccess(
    res,
    convertedData,
    tokens,
    message,
    statusCode
  );
};

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message = 'Success',
  statusCode = 200,
  meta?: ApiResponse<T>['meta']
) => {
  const response: ApiResponse<T> = {
    type: 'success',
    message,
    data: data ?? null,
  };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500
) => {
  const response: ApiResponse<null> = {
    type: 'error',
    message,
    data: null,
  };
  return res.status(statusCode).json(response);
};

export const sendFail = (
  res: Response,
  message: string,
  statusCode = 400
) => {
  const response: ApiResponse<null> = {
    type: 'fail',
    message,
    data: null,
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

export const sendNotFound = (res: Response, message = 'Resource not found') => {
  return sendFail(res, message, 404);
};

export const sendBadRequest = (res: Response, message = 'Bad request') => {
  return sendFail(res, message, 400);
};

export const sendUnauthorized = (res: Response, message = 'Unauthorized') => {
  return sendFail(res, message, 401);
};

export const sendForbidden = (res: Response, message = 'Forbidden') => {
  return sendFail(res, message, 403);
};

/**
 * Convert date fields in response data from UTC to Jakarta timezone
 * Recursively processes objects and arrays
 *
 * @param data - Response data that may contain date fields
 * @returns Data with dates converted to Jakarta timezone (ISO string format)
 */
export const convertDatesToJakarta = <T>(data: T): T => {
  if (!data) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertDatesToJakarta(item)) as unknown as T;
  }

  // Handle objects
  if (typeof data === 'object' && data !== null) {
    const converted: any = {};

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = (data as any)[key];

        // Convert Date objects or date strings
        if (value instanceof Date) {
          converted[key] = timezoneUtil.formatToJakartaISO(value);
        } else if (
          typeof value === 'string' &&
          (key.includes('_at') || key.includes('_date') || key.includes('Date')) &&
          !isNaN(Date.parse(value))
        ) {
          // Convert string dates (common field names: created_at, updated_at, invoice_date, etc.)
          converted[key] = timezoneUtil.formatToJakartaISO(value);
        } else if (typeof value === 'object' && value !== null) {
          // Recursively process nested objects
          converted[key] = convertDatesToJakarta(value);
        } else {
          converted[key] = value;
        }
      }
    }

    return converted as T;
  }

  return data;
};

/**
 * Send success response with dates automatically converted to Jakarta timezone
 */
export const sendSuccessWithDates = <T>(
  res: Response,
  data?: T,
  message = 'Success',
  statusCode = 200,
  meta?: ApiResponse<T>['meta']
) => {
  const convertedData = convertDatesToJakarta(data);
  return sendSuccess(res, convertedData, message, statusCode, meta);
};

/**
 * Send created response with dates automatically converted to Jakarta timezone
 */
export const sendCreatedWithDates = <T>(
  res: Response,
  data: T,
  message = 'Created successfully'
) => {
  const convertedData = convertDatesToJakarta(data);
  return sendCreated(res, convertedData, message);
};
