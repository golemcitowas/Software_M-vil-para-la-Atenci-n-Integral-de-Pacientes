import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// 🔴 REEMPLAZA CON TUS DATOS DE SUPABASE 🔴
const supabaseUrl = 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = 'tu-clave-anon-aqui';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
