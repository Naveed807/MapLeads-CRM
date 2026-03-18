import { Request, Response, NextFunction } from 'express';
import { userRepository } from '../repositories/UserRepository';
import { ok } from '@mapleads/shared';
import { AuthError } from '../errors/AppError';
import bcrypt from 'bcrypt';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userRepository.findById(req.user!.id);
      res.json(ok(user));
    } catch (e) { next(e); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, avatarUrl } = req.body;
      const user = await userRepository.update(req.user!.id, { name, avatarUrl });
      res.json(ok(user, 'Profile updated'));
    } catch (e) { next(e); }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userRepository.findById(req.user!.id);
      if (!user) throw new AuthError('User not found');
      const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
      if (!valid) throw new AuthError('Current password is incorrect');
      const hash = await bcrypt.hash(req.body.newPassword, 12);
      await userRepository.update(req.user!.id, { passwordHash: hash });
      res.json(ok(null, 'Password changed'));
    } catch (e) { next(e); }
  }
}

export const userController = new UserController();
