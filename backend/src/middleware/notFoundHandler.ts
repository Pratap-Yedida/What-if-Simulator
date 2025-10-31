import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from './errorHandler';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
  next(error);
};
