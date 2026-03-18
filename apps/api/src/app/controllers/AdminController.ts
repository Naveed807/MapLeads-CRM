import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/AdminService';
import { ok } from '@mapleads/shared';

export class AdminController {
  // ── System ──────────────────────────────────────────────────────────────
  async getSystemStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getSystemStats();
      res.json(ok(stats));
    } catch (e) { next(e); }
  }

  // ── Users ────────────────────────────────────────────────────────────────
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page    = parseInt(req.query.page    as string || '1',  10);
      const perPage = parseInt(req.query.perPage as string || '20', 10);
      const search  = req.query.search as string | undefined;
      const data = await adminService.listUsers(page, perPage, search);
      res.json(ok(data));
    } catch (e) { next(e); }
  }

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminService.getUser(req.params.id as string);
      res.json(ok(user));
    } catch (e) { next(e); }
  }

  async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminService.suspendUser(req.params.id as string, req.body.suspend);
      const msg = req.body.suspend ? 'User suspended' : 'User unsuspended';
      res.json(ok(user, msg));
    } catch (e) { next(e); }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.deleteUser(req.params.id as string);
      res.json(ok(null, 'User deleted'));
    } catch (e) { next(e); }
  }

  // ── Organizations ────────────────────────────────────────────────────────
  async listOrgs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page    = parseInt(req.query.page    as string || '1',  10);
      const perPage = parseInt(req.query.perPage as string || '20', 10);
      const data = await adminService.listOrgs(page, perPage);
      res.json(ok(data));
    } catch (e) { next(e); }
  }

  async getOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await adminService.getOrg(req.params.id as string);
      res.json(ok(org));
    } catch (e) { next(e); }
  }

  async deleteOrg(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.deleteOrg(req.params.id as string);
      res.json(ok(null, 'Organization deleted'));
    } catch (e) { next(e); }
  }

  // ── Plans ────────────────────────────────────────────────────────────────
  async listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await adminService.listPlans();
      res.json(ok(plans));
    } catch (e) { next(e); }
  }

  async overridePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sub = await adminService.overridePlan(req.params.orgId as string, req.body.planId);
      res.json(ok(sub, 'Plan overridden'));
    } catch (e) { next(e); }
  }

  // ── Email Logs ───────────────────────────────────────────────────────────
  async getEmailLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page    = parseInt(req.query.page    as string || '1',  10);
      const perPage = parseInt(req.query.perPage as string || '20', 10);
      const logs = await adminService.getEmailLogs(page, perPage);
      res.json(ok(logs));
    } catch (e) { next(e); }
  }
}

export const adminController = new AdminController();
