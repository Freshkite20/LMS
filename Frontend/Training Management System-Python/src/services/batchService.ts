import api from './api';

export interface Batch {
    id: string;
    name: string;
    description?: string;
    students: number;
    courses: number;
    progress: number;
    startDate?: string;
    endDate?: string;
    status?: string;
}

export const batchService = {
    getAll: async (): Promise<Batch[]> => {
        try {
            console.log('Fetching batches from /admin/batches...');
            const response = await api.get('/admin/batches');
            console.log('Batches response:', response.data);
            if (response.data.success) {
                console.log('Number of batches:', response.data.data?.length || 0);
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch batches');
        } catch (error: any) {
            console.error('Error fetching batches:', error);
            throw error;
        }
    },

    create: async (batchData: any): Promise<Batch> => {
        try {
            console.log('Creating batch:', batchData);
            const response = await api.post('/batches', batchData);
            console.log('Create batch response:', response.data);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to create batch');
        } catch (error: any) {
            console.error('Error creating batch:', error);
            throw error;
        }
    },

    assignStudents: async (batchId: string, studentIds: string[]): Promise<any> => {
        try {
            console.log(`Assigning students to batch ${batchId}:`, studentIds);
            const response = await api.post(`/batches/${batchId}/students`, { studentIds });
            console.log('Assign students response:', response.data);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to assign students');
        } catch (error: any) {
            console.error('Error assigning students:', error);
            throw error;
        }
    }
};
