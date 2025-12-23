import api from './api';

export interface StudentEnrollmentData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    batch?: string;
}

export interface Student {
    id: string;
    name: string;
    email: string;
    batch: string;
    enrolled: string;
}

export const studentService = {
    getAll: async (): Promise<Student[]> => {
        try {
            console.log('Fetching students from /admin/students...');
            const response = await api.get('/admin/students');
            console.log('Students response:', response.data);
            if (response.data.success) {
                console.log('Number of students:', response.data.data?.length || 0);
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch students');
        } catch (error: any) {
            console.error('Error fetching students:', error);
            throw error;
        }
    },

    enrollStudent: async (data: StudentEnrollmentData) => {
        try {
            const payload = {
                ...data,
                batchId: data.batch // Map batch to batchId matches backend expectation
            };
            const response = await api.post('/students/enroll', payload);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to enroll student');
        } catch (error: any) {
            console.error('Error enrolling student:', error);
            throw error;
        }
    },

    getDashboardStats: async () => {
        try {
            const response = await api.get('/students/dashboard'); // Endpoint needs implementation in backend router
            // Wait, I saw StudentsController.getDashboard, but is it routed?
            // Checking routes/students.ts...
            // It needs to be routed.
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch dashboard');
        } catch (error: any) {
            console.error('Error fetching dashboard:', error);
            throw error;
        }
    },

    getStudentCourses: async (studentId: string) => {
        try {
            const response = await api.get(`/students/${studentId}/courses`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch courses');
        } catch (error: any) {
            console.error('Error fetching courses:', error);
            throw error;
        }
    },

    getPendingTests: async (courses: any[]) => {
        try {
            const allTests: any[] = [];
            for (const course of courses) {
                try {
                    const response = await api.get(`/tests?courseId=${course.id}`);
                    if (response.data.success && Array.isArray(response.data.data)) {
                        // Add courseName to each test for display purposes
                        const testsWithCourse = response.data.data.map((t: any) => ({
                            ...t,
                            courseName: course.title
                        }));
                        allTests.push(...testsWithCourse);
                    }
                } catch (err) {
                    console.warn(`Failed to fetch tests for course ${course.id}`, err);
                }
            }
            return allTests;
        } catch (error: any) {
            console.error('Error fetching pending tests:', error);
            return [];
        }
    }
};
