import { Request, Response, NextFunction } from 'express';
import { teamService } from '../services/TeamService';
import { ok } from '@mapleads/shared';

export class TeamController {

  async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await teamService.listMembers(req.org!.id);
      res.json(ok(members));
    } catch (e) { next(e); }
  }

  async inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await teamService.inviteMember(req.org!.id, req.body, req.user!.id);
      res.status(201).json(ok(result, 'Team member added successfully'));
    } catch (e) { next(e); }
  }

  async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await teamService.updateMemberRole(
        req.org!.id, String(req.params.userId), req.body.role, req.user!.id,
      );
      res.json(ok(member, 'Role updated'));
    } catch (e) { next(e); }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await teamService.removeMember(req.org!.id, String(req.params.userId), req.user!.id);
      res.json(ok(null, 'Member removed'));
    } catch (e) { next(e); }
  }

  async getMemberAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assignments = await teamService.getMemberAssignments(
        req.org!.id, String(req.params.memberId), req.user!.id,
      );
      res.json(ok(assignments));
    } catch (e) { next(e); }
  }

  async setMemberAssignments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await teamService.setMemberAssignments(
        req.org!.id, String(req.params.memberId), req.body.bizIds ?? [], req.user!.id,
      );
      res.json(ok(result, 'Assignments updated'));
    } catch (e) { next(e); }
  }
}

export const teamController = new TeamController();
