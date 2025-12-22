import api from './api';

export interface Course {
    id: string;
    title: string;
    description?: string;
    template: string;
    enrolled: number;
    avgProgress: number;
    status: string;
    category?: string;
    difficulty?: string;
}

export const courseService = {
    getAll: async (): Promise<Course[]> => {
        try {
            console.log('Fetching courses from /admin/courses...');
            const response = await api.get('/admin/courses');
            console.log('Courses API response:', response);
            console.log('Response data:', response.data);

            if (response.data.success) {
                console.log('Courses data:', response.data.data);
                console.log('Number of courses:', response.data.data?.length || 0);
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch courses');
        } catch (error: any) {
            console.error('Error fetching courses:', error);
            console.error('Error response:', error.response);
            console.error('Error message:', error.message);
            throw error;
        }
    },

    create: async (courseData: any): Promise<Course> => {
        try {
            console.log('Creating course:', courseData);
            const response = await api.post('/courses', courseData);
            console.log('Create course response:', response.data);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to create course');
        } catch (error: any) {
            console.error('Error creating course:', error);
            throw error;
        }
    },

    addSection: async (courseId: string, sectionData: any): Promise<any> => {
        try {
            console.log(`Adding section to course ${courseId}:`, sectionData);
            const response = await api.post(`/courses/${courseId}/sections`, sectionData);
            console.log('Add section response:', response.data);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to add section');
        } catch (error: any) {
            console.error('Error adding section:', error);
            throw error;
        }
    },

    publish: async (courseId: string): Promise<any> => {
        try {
            console.log(`Publishing course ${courseId}...`);
            const response = await api.put(`/courses/${courseId}/publish`);
            console.log('Publish course response:', response.data);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to publish course');
        } catch (error: any) {
            console.error('Error publishing course:', error);
            throw error;
        }
    },

    assign: async (courseId: string, assignmentData: { assignmentType: 'individual' | 'batch', studentIds?: string[], batchIds?: string[], dueDate?: string }): Promise<any> => {
        try {
            console.log(`Assigning course ${courseId}:`, assignmentData);
            const response = await api.post(`/courses/${courseId}/assign`, assignmentData);
            console.log('Assign course response:', response.data);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to assign course');
        } catch (error: any) {
            console.error('Error assigning course:', error);
            throw error;
        }
    },

    getCourseWithSections: async (courseId: string): Promise<any> => {
        try {
            console.log(`Fetching course ${courseId} with sections...`);
            const response = await api.get(`/courses/${courseId}?includeSections=true`);
            console.log('Get course response:', response.data);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch course');
        } catch (error: any) {
            console.error('Error fetching course:', error);
            throw error;
        }
    },

    createFromDoc: async (docLink: string): Promise<any> => {
        try {
            console.log('Creating course from doc:', docLink);
            const response = await api.post('/docs/create-course', { docLink });
            console.log('Create from doc response:', response.data);
            if (response.data.success) {
                return response.data.course;
            }
            throw new Error(response.data.message || 'Failed to create course from doc');
        } catch (error: any) {
            console.error('Error creating course from doc:', error);
            throw error;
        }
    }
};
