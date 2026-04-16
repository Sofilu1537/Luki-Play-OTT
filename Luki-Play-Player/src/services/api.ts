import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// La URL base apuntará al servidor local de NestJS corriendo en el puerto 8100 
// según la configuración del repositorio OTT.
// Si estás probando en dispositivo físico (Android/iOS), locahost no funcionará.
// Para simuladores/web localhost está bien, pero para device usa la IP de tu red local.
const baseURL = Platform.OS === 'web' ? 'http://localhost:8100/auth' : 'http://127.0.0.1:8100/auth'; 

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
