import { createContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }
            const { data } = await API.get('/auth/me');
            setUser(prev => ({ ...(prev || {}), ...data }));
            localStorage.setItem('user', JSON.stringify(data));
        } catch (err) {
            console.error('Failed to refresh user profile:', err);
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const raw = localStorage.getItem('user');
        if (raw) {
            try {
                setUser(JSON.parse(raw));
            } catch (e) {
                localStorage.removeItem('user');
            }
        }
        refreshUser();
    }, [refreshUser]);

    const login = async (email, password) => {
        const { data } = await API.post('/auth/login', { email, password });
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        localStorage.setItem('token', data.token);
        return data;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    const changePassword = async (currentPassword, newPassword) => {
        const { data } = await API.post('/auth/change-password', { currentPassword, newPassword });
        return data;
    };

    const updateProfile = async (formData) => {
        const { data } = await API.put('/auth/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (data.user) {
            setUser(prev => ({ ...(prev || {}), ...data.user }));
            const currentRaw = localStorage.getItem('user');
            const parsed = currentRaw ? JSON.parse(currentRaw) : {};
            localStorage.setItem('user', JSON.stringify({ ...parsed, ...data.user }));
        }
        return data;
    };

    const isAdmin = user?.role === 'Admin';
    const isProcurement = user?.role === 'Procurement Manager';
    const isDepartmentUser = user?.role === 'Department User';

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            login,
            logout,
            loading,
            refreshUser,
            changePassword,
            updateProfile,
            isAdmin,
            isProcurement,
            isDepartmentUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};