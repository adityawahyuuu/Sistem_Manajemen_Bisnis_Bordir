import { Response } from 'express';

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
}

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
