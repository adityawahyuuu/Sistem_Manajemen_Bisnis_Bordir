import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendBadRequest } from '../shared/utils/response.util';

export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map(d => d.message).join(', ');
      return sendBadRequest(res, `Validation error: ${errorMessage}`);
    }

    req[property] = value;
    next();
  };
};
