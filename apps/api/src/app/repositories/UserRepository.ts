import { prisma } from '../../config/database';
import { BaseRepository } from './BaseRepository';

type User = Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>;

export class UserRepository extends BaseRepository<User> {
  protected model = prisma.user;

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: Record<string, any>): Promise<User> {
    return prisma.user.create({ data: data as any });
  }

  async update(id: string, data: Record<string, any>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async findAllPaginated(page: number, perPage: number, search?: string) {
    const where: Record<string, any> = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip: (page - 1) * perPage, take: perPage, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    return { users, total };
  }
}

export const userRepository = new UserRepository();
