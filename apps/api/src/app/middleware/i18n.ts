import { Request, Response, NextFunction } from 'express';

const SUPPORTED_LOCALES = ['en', 'ar', 'ur', 'fr', 'es'];

// Sets req.locale from Accept-Language header or query param
export function setLocale(req: Request, _res: Response, next: NextFunction): void {
  const headerLang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  const queryLang  = req.query.lang as string | undefined;

  const lang = queryLang || headerLang || 'en';
  req.locale = SUPPORTED_LOCALES.includes(lang) ? lang : 'en';
  next();
}

export const i18nMiddleware = setLocale;

