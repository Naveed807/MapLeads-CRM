import { Job } from 'bullmq';
import { prisma } from '../../config/database';
import { logger } from '../middleware/logger';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../../config/app';

export interface ExportCSVJobData {
  orgId:  string;
  userId: string;
  filter: Record<string, unknown>;
}

export async function processExportCSV(job: Job<ExportCSVJobData>): Promise<void> {
  const { orgId, filter } = job.data;

  const businesses = await prisma.business.findMany({
    where:   { orgId, ...(filter as any) },
    include: { tags: true, contact: true },
    take:    10_000,
  });

  const rows = businesses.map((b: any) => ({
    Name:    b.name,
    Status:  b.status,
    Phone:   b.phone   ?? '',
    Website: b.website ?? '',
    Address: b.address ?? '',
    Note:    b.note    ?? '',
    Tags:    b.tags.map((t: any) => t.name).join(', '),
    Source:  b.source  ?? '',
    'Created At': b.createdAt.toISOString(),
  }));

  const wb  = XLSX.utils.book_new();
  const ws  = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Businesses');

  const uploadsDir = path.join(config.upload.uploadDir ?? 'uploads', 'exports');
  fs.mkdirSync(uploadsDir, { recursive: true });

  const filename = `export_${orgId}_${Date.now()}.xlsx`;
  const filepath = path.join(uploadsDir, filename);
  XLSX.writeFile(wb, filepath);

  logger.info('Export completed', { orgId, rows: rows.length, filepath });
}

export { processExportCSV as exportCsvWorker };

