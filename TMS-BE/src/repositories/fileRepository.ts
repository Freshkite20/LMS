import { v4 as uuidv4 } from 'uuid';
import { File } from '../models/File.js';

export class FilesRepository {
  static async create(input: any) {
    const now = new Date();
    const file = {
      id: uuidv4(),
      file_name: input.file_name,
      file_path: input.file_path,
      file_type: input.file_type,
      file_size: input.file_size,
      uploaded_by: input.uploaded_by,
      processing_status: 'pending',
      uploaded_at: now
    };
    await File.create(file);
    return file;
  }
  static async updateStatus(fileId: string, status: 'pending' | 'processing' | 'completed' | 'failed') {
    await File.updateOne({ id: fileId }, { $set: { processing_status: status } });
  }
  static async getById(fileId: string) {
    return File.findOne({ id: fileId });
  }
}
