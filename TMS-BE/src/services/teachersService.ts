import { TeachersRepository } from '../repositories/teacherRepository.js';

export class TeachersService {
    static async getDashboardStats() {
        const data = await TeachersRepository.getDashboardStats();
        return data;
    }
}
