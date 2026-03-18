import { prisma } from '../../config/database';
import { BaseRepository } from './BaseRepository';

type Template = Awaited<ReturnType<typeof prisma.template.findUniqueOrThrow>>;

export class TemplateRepository extends BaseRepository<Template> {
  protected model = prisma.template;

  async findByOrg(orgId: string, type?: string) {
    return prisma.template.findMany({
      where:   { orgId, ...(type && { type }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findDefault(orgId: string, type: string) {
    return prisma.template.findFirst({
      where: { orgId, type, isDefault: true },
    });
  }

  async create(data: Record<string, any>): Promise<Template> {
    return prisma.template.create({ data: data as any });
  }

  async update(id: string, orgId: string, data: Record<string, any>): Promise<Template> {
    return prisma.template.update({ where: { id }, data });
  }

  async setDefault(id: string, orgId: string, type: string): Promise<void> {
    await prisma.$transaction([
      prisma.template.updateMany({ where: { orgId, type, isDefault: true }, data: { isDefault: false } }),
      prisma.template.update({ where: { id }, data: { isDefault: true } }),
    ]);
  }

  async countByOrg(orgId: string): Promise<number> {
    return prisma.template.count({ where: { orgId } });
  }
}

export const templateRepository = new TemplateRepository();
