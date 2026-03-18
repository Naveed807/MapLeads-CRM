import { prisma } from '../../config/database';

// Generic base repository — all repos extend this
export abstract class BaseRepository<T> {
  protected abstract model: any;

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.model.delete({ where: { id } });
  }
}
