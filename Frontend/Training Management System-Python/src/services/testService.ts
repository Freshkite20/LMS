import api from './api';

export const testService = {
    uploadQuestions: async (testId: string, file: File): Promise<any> => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            console.log(`Uploading questions for test ${testId}...`);
            const response = await api.post(`/tests/${testId}/upload-questions`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Upload questions response:', response.data);
            if (response.data.success) {
                return response.data;
            }
            throw new Error(response.data.message || 'Failed to upload questions');
        } catch (error: any) {
            console.error('Error uploading questions:', error);
            console.error('Error response data:', error.response?.data);
            console.error('Error response status:', error.response?.status);
            throw error;
        }
    },

    // Placeholder for other test related methods
    createTest: async (testData: any): Promise<any> => {
        try {
            console.log('Creating test:', testData);
            const response = await api.post('/tests', testData);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to create test');
        } catch (error: any) {
            console.error('Error creating test:', error);
            throw error;
        }
    },

    getTest: async (testId: string): Promise<any> => {
        try {
            console.log(`Fetching test ${testId}...`);
            const response = await api.get(`/tests/${testId}?includeQuestions=true`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch test');
        } catch (error: any) {
            console.error('Error fetching test:', error);
            throw error;
        }
    },

    submitTest: async (testId: string, studentId: string, answers: { questionId: string; answerText: string }[]): Promise<any> => {
        try {
            console.log('Submitting test:', { testId, studentId, answers });
            const response = await api.post(`/tests/${testId}/submit`, {
                studentId,
                answers
            });
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to submit test');
        } catch (error: any) {
            console.error('Error submitting test:', error);
            throw error;
        }
    }
};
