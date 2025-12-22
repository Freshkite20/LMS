import { FilesRepository } from '../repositories/fileRepository.js';

export class FilesService {

   static async createFile(body: any) {
    return FilesRepository.create(body);
  }

  static async updateStatus(fileId: string, status: 'pending' | 'processing' | 'completed' | 'failed') {
    const f = await FilesRepository.getById(fileId);
    if (!f) throw Object.assign(new Error('File not found'), { status: 404 });

    await FilesRepository.updateStatus(fileId, status);
    return { fileId, status };
  }

  
  static async getStatus(fileId: string) {
    const f = await FilesRepository.getById(fileId);
    if (!f) throw Object.assign(new Error('File not found'), { status: 404 });
    return {
      fileId: f.id,
      processingStatus: f.processing_status,
      extractedSections: f.extracted_sections || 0,
      errors: [],
      completedAt: f.completed_at || null
    };
  }
}

