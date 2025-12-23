import api from './api';

export interface DashboardStats {
    totalBatches: number;
    totalStudents: number;
    totalCourses: number;
    activeCourses: number;
}

export const adminService = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        try {
            console.log('Fetching dashboard stats from /admin/dashboard...');
            const response = await api.get('/admin/dashboard');
            console.log('Dashboard stats response:', response.data);
            if (response.data.success) {
                return response.data.data.overview;
            }
            throw new Error(response.data.message || 'Failed to fetch dashboard stats');
        } catch (error: any) {
            console.error('Error fetching dashboard stats:', error);
            if (error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }
            throw error;
        }
    }
};
