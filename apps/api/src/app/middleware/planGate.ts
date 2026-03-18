import { Request, Response, NextFunction } from 'express';
import { PlanLimitError } from '../errors/AppError';
import { PlanConfig } from '../../config/plans';

// Factory — use like: planGate('canExportCsv')
export function planGate(feature: keyof PlanConfig) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const plan = req.org?.subscription?.plan as any;
    if (!plan) {
      return next(new PlanLimitError('NO_SUBSCRIPTION', 'No active subscription'));
    }
    if (!plan[feature]) {
      return next(new PlanLimitError(
        'FEATURE_NOT_AVAILABLE',
        `This feature requires a higher plan. Please upgrade.`,
      ));
    }
    next();
  };
}
