import api from './api';

export interface User {
    id: string;
    name: string;
    role: string;
    email: string;
}

export interface LoginResponse {
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
}

export const authService = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await api.post('/auth/login', { username, password });

            if (response.data.success) {
                const { token, user } = response.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                console.log();
                
                return {
                    success: true,
                    user,
                    token
                };
            }
            return {
                success: false,
                error: response.data.message || 'Login failed'
            };
        } catch (error: any) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message || 'Login failed'
            };
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return { success: true };
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        console.log(userStr);
        
        if (userStr) {
            try {
                return JSON.parse(userStr);
                console.log();
                
                
            } catch (e) {
                return null;
            }
        }
        return null;
    }
};
