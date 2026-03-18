import { Request, Response, NextFunction } from 'express';
import { organizationService } from '../services/OrganizationService';
import { ok } from '@mapleads/shared';

export class OrganizationController {
  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organizationService.get(req.org!.id);
      res.json(ok(org));
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await organizationService.update(req.org!.id, req.body, req.user!.id);
      res.json(ok(org, 'Organization updated'));
    } catch (e) { next(e); }
  }

  async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await organizationService.getMembers(req.org!.id);
      res.json(ok(members));
    } catch (e) { next(e); }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await organizationService.removeMember(req.org!.id, req.params.userId as string, req.user!.id);
      res.json(ok(null, 'Member removed'));
    } catch (e) { next(e); }
  }
}

export const organizationController = new OrganizationController();
