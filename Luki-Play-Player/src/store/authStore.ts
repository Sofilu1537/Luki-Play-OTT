import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
  error: string | null;
  loginToken: string | null;
  requestOtp: (email: string, password: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  loginToken: null,

  requestOtp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const deviceId = 'dummy-device-' + Platform.OS; // Idealmente usar expo-device
      const response = await api.post('/app/login', { 
         email, 
         password, 
         deviceId 
      });
      // Guardar el loginToken para el paso 2
      set({ loading: false, loginToken: response.data.loginToken });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Error al solicitar OTP', loading: false });
      return false;
    }
  },

  verifyOtp: async (code: string) => {
    set({ loading: true, error: null });
    try {
      const loginToken = useAuthStore.getState().loginToken;
      const response = await api.post('/app/verify-otp', { code, loginToken });
      const { accessToken, refreshToken, canAccessOtt } = response.data;
      
      if (canAccessOtt === false) {
         set({ error: 'Tu cuenta no tiene permisos OTT activos', loading: false });
         return false;
      }

      await AsyncStorage.setItem('accessToken', accessToken);
      // await AsyncStorage.setItem('refreshToken', refreshToken);

      set({ isAuthenticated: true, loading: false });
      return true;
    } catch (err: any) {
      set({ error: 'Código incorrecto', loading: false });
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('accessToken');
    set({ isAuthenticated: false, user: null });
    // Llamar a /logout en backend
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
         // Opcional: Validar con /me
         const res = await api.get('/me');
         set({ isAuthenticated: true, user: res.data, loading: false });
      } else {
         set({ isAuthenticated: false, loading: false });
      }
    } catch {
      await AsyncStorage.removeItem('accessToken');
      set({ isAuthenticated: false, loading: false });
    }
  }
}));
