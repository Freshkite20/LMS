import { AdminRepository } from '../repositories/adminRepository.js';

export class AdminService {
  static async getDashboardStats() {
    const data = await AdminRepository.getDashboardStats();
    return data;
  }

  static async getBatches() {
    return await AdminRepository.getBatches();
  }

  static async getCourses() {
    return await AdminRepository.getCourses();
  }

  static async getRecentStudents(limit?: number) {
    return await AdminRepository.getRecentStudents(limit);
  }
}

